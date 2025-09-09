import GObject from "@girs/gobject-2.0";
import St from "gi://St";
import Clutter from "gi://Clutter";
import GLib from "gi://GLib";
import Soup from "gi://Soup";

import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as Currencies from "./currencies.js";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    displayText = "...";
    private _httpSession: Soup.Session;
    private _ext: Extension;
    private static api_url: string = "https://data-asg.goldprice.org/dbXRates/";
    private static ounce_to_gram = 31.1034768;
    private static goldColor = '#FFD700';
    private static silverColor = '#C0C0C0';
    private lock: boolean;
    private price: St.Label;
    private lastUpdate: PopupMenu.PopupMenuItem;
    private refreshBtn: PopupMenu.PopupMenuItem;
    private backgroundTask: number;
    private showTask: number;
    private _au_turn: boolean = true;
    private _au_price: number = 0;
    private _au_change: number = 0;
    private _au_pchange: number = 0;
    private _ag_price: number = 0;
    private _ag_change: number = 0;
    private _ag_pchange: number = 0;

    constructor(ext: Extension) {
      super(0.0, _("Gold Price Indicator"));
      this._httpSession = new Soup.Session();
      this._ext = ext;
      this.lock = false;

      // Components
      this.price = new St.Label({
        text: "...",
        y_align: Clutter.ActorAlign.CENTER,
      });
      this.lastUpdate = new PopupMenu.PopupMenuItem(_(`Last update: ...`));
      this.refreshBtn = new PopupMenu.PopupMenuItem(_(`Refresh`));
      let settingsBtn = new PopupMenu.PopupMenuItem(_(`Settings`));
      // Events
      this.refreshBtn.connect("activate", () => {
        this._fetch_data();
      });
      settingsBtn.connect("activate", () => {
        this._ext.openPreferences();
      });
      // Display
      this.menu.addMenuItem(this.lastUpdate);
      this.menu.addMenuItem(this.refreshBtn);
      this.menu.addMenuItem(settingsBtn);
      this.add_child(this.price);
      // Event loop
      this._fetch_data();
      this.backgroundTask = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._get_refresh_interval() * 60, () => {
        this._fetch_data();
        return GLib.SOURCE_CONTINUE;
      });
      this.showTask = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
        this._show_data();
        return GLib.SOURCE_CONTINUE;
      });
    }

    _get_setting_val(key: string) {
      return this._ext._settings.get_value(key).unpack();
    }

    _get_unit() {
      const key = (this._au_turn ? 'gold' : 'silver') + '-weight-unit';
      switch (this._get_setting_val(key)) {
        case 0:
          return "℥";
        case 1:
          return "g";
        case 2:
          return "kg";
        case 3:
          return "tola";
      }
      return "℥";
    }

    _get_currency() {
      const cIdx = this._get_setting_val("currency");
      return Currencies.list()[cIdx].unit;
    }

    _get_refresh_interval() {
      return this._get_setting_val("refresh-interval");
    }

    _build_req() {
      const url = `${Indicator.api_url}${this._get_currency()}`
      let request = Soup.Message.new("GET", url);
      request.request_headers.append("Cache-Control", "no-cache");
      request.request_headers.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6831.62 Safari/537.36");

      this._log([url]); // debug
      return request;
    }

    _get_unit_price(price: number, key: string) {
      switch (this._get_setting_val(key + '-weight-unit')) {
        case 1:
          return price / Indicator.ounce_to_gram;
        case 2:
          return (price / Indicator.ounce_to_gram) * 1000;
        case 3:
          return price * 3 / 8;
      }

      return price;
    }

    _format_num(auval: number, agval: number) {
      const w = 2;
      var s1 = Math.abs(auval).toFixed(w);
      var s2 = Math.abs(agval).toFixed(w);
      const m = Math.max(s1.length, s2.length);
      return (this._au_turn ? s1 : s2).padEnd(m, ' ');
    }

    _format_num_unit(auval: number, agval: number) {
      auval = this._get_unit_price(auval, 'gold');
      agval = this._get_unit_price(agval, 'silver');
      if (this._au_turn) {
        agval = Math.max(auval, agval);
      } else {
        auval = Math.max(auval, agval);
      }

      return this._format_num(auval, agval);
    }

    _show_data() {
      const prefix = this._au_turn ? 'AU' : 'AG'
      const prefixColor = this._au_turn ? Indicator.goldColor : Indicator.silverColor;
      const latest_price = this._format_num_unit(this._au_price, this._ag_price);
      const latest_change = this._format_num_unit(this._au_change, this._ag_change);
      const latest_pchange = this._format_num(this._au_pchange, this._ag_pchange);
      const change = this._au_turn ? this._au_change : this._ag_change;
      this._au_turn = !this._au_turn;

      const color = change > 0 ? 'green' : 'red';
      const sign = change > 0 ? '+' : '-';
      this.price.set_text(`<span font_family="monospace">:<span foreground="${prefixColor}">${prefix}</span>: ${latest_price} <span foreground="${color}">${sign}${latest_change} ${sign}${latest_pchange}%</span></span>`);
      this.price.clutter_text.set_use_markup(true);
    }

    _fetch_data() {
      if (this.lock) {
        return;
      }
      this.lock = true;
      let msg = this._build_req();
      this._httpSession.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (_, response) => {
        response = new TextDecoder("utf-8").decode(this._httpSession.send_and_read_finish(response).get_data());

        if (msg.get_status() > 299) {
          this._log(["Remote server error:", msg.get_status(), response]);
          return;
        }

        //this._log([response]);
        const json_data = JSON.parse(response);
        if (json_data.length === 0) {
          this._log(["Remote server error:", response]);
          return;
        }

        let item = json_data['items'][0];

        this._au_price = Number.parseFloat(item['xauPrice']);
        this._au_change = Number.parseFloat(item['chgXau']);
        this._au_pchange = Number.parseFloat(item['pcXau']);
        this._ag_price = Number.parseFloat(item['xagPrice']);
        this._ag_change = Number.parseFloat(item['chgXag']);
        this._ag_pchange = Number.parseFloat(item['pcXag']);

        this.lastUpdate.label_actor.text = "Last update: " + new Date().toLocaleTimeString();
        const next_update = Date.now() + this._get_refresh_interval() * 60 * 1000;
        const next_update_str = new Date(next_update).toLocaleTimeString();
        this.refreshBtn.label.set_text(`Refresh [Next update: ${next_update_str}]`);

        this._show_data();
      });
      this.lock = false;
    }

    _log(logs: string[]) {
      console.log("[GoldPriceMonitor]", logs.join(", "));
      // Main.notifyError("GoldPriceMonitor", logs.join(", "));
    }

    destroy() {
      // Remove the background taks
      GLib.source_remove(this.backgroundTask);
      GLib.source_remove(this.showTask);
      super.destroy();
    }
  }
);

export default class GoldPriceIndicatorExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._indicator = new Indicator(this);
    this.addToPanel(this._settings.get_value("panel-position").unpack());

    ["gold-weight-unit", "silver-weight-unit", "currency", "refresh-interval", "panel-position"].forEach((key) => {
      this._settings.connect(`changed::${key}`, () => {
        this.disable();
        this.enable();
      });
    });
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
    this._settings = null;
  }

  addToPanel(indicator_position) {
    switch (indicator_position) {
      case 0:
        Main.panel.addToStatusArea(this.uuid, this._indicator, Main.panel._leftBox.get_children().length, "left");
        break;
      case 1:
        Main.panel.addToStatusArea(this.uuid, this._indicator, Main.panel._centerBox.get_children().length, "center");
        break;
      case 2:
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        break;
    }
  }
}
