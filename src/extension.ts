import Gio from "gi://Gio";
import GObject from "@girs/gobject-2.0";
import St from "gi://St";
import Clutter from "gi://Clutter";
import GLib from "gi://GLib";

import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { SourceMappings } from "./source.js";
import { Fetcher } from "./fetcher.js";

interface PriceData {
  index: string;
  name: string;
  color: string;
  price: number;
  change: number;
  pchange: number;
};

const MetalMappings = {
  gold: { name: 'AU', color: '#FFD700' },
  silver: { name: 'AG', color: '#C0C0C0' },
  platinum: { name: 'PT', color: '#E5E4E2' },
  palladium: { name: 'PD', color: '#B1B1B1' },
  rhodium: { name: 'RH', color: '#D1D7D7' },
};

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    displayText = "...";
    private _ext: Extension;
    private _settings: Gio.Settings;
    private static ounce_to_gram = 31.1034768;
    private lock: boolean;
    private price: St.Label;
    private lastUpdate: PopupMenu.PopupMenuItem;
    private refreshBtn: PopupMenu.PopupMenuItem;
    private backgroundTask: number;
    private showTask: number;
    private _fetcher: Fetcher | undefined;
    private _turn: number;
    private _priceData: PriceData[] = [];

    constructor(ext: Extension, settings: Gio.Settings) {
      super(0.0, _("Gold Price Indicator"));
      this._ext = ext;
      this._settings = settings;
      this.lock = false;
      this._turn = 0;

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

      ["enabled-source", "currency"].forEach((key) => {
        this._settings!.connect(`changed::${key}`, () => {
          this._fetch_data();
        });
      });
      Object.keys(MetalMappings).forEach((key) => {
        this._settings!.connect(`changed::${key}-weight-unit`, () => {
          this._show_data();
        });
      });

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

    private _get_refresh_interval(): number {
      return this._settings.get_int('refresh-interval');
    }

    private _get_unit_price(price: number, key: string): number {
      return this._get_unit_price_for_type(price, this._settings.get_int(key + '-weight-unit'));
    }

    private _get_unit_price_in_ounce(price: number, sourceType: number): number {
      switch (sourceType) {
        case 1: // Gram
          return price * Indicator.ounce_to_gram;
        case 2: // Kilo Gram
          return (price * Indicator.ounce_to_gram) / 1000;
        case 3: // Tola
          return price / (3 / 8);
      }

      return price;
    }

    private _get_unit_price_from_ounce(price: number, destinationType: number): number {
      switch (destinationType) {
        case 1: // Gram
          return price / Indicator.ounce_to_gram;
        case 2: // Kilo Gram
          return (price / Indicator.ounce_to_gram) * 1000;
        case 3: // Tola
          return price * 3 / 8;
      }

      return price;
    }

    private _get_unit_price_for_type(price: number, destinationType: number, sourceType: number = 0): number {
      if (sourceType == destinationType) {
        return price;
      }

      price = this._get_unit_price_in_ounce(price, sourceType);
      price = this._get_unit_price_from_ounce(price, destinationType);
      return price;
    }

    private _format_num(val: number): string {
      const w = 2;
      return Math.abs(val).toFixed(w);
    }

    private _format_num_unit(value: number, name: string, values: [number, string][]): string {
      const strValue = this._format_num(this._get_unit_price(value, name));
      const lengths = values.map(([v, n]) => this._format_num(this._get_unit_price(v, n)).length);
      const maxLength = Math.max(...lengths);
      return strValue.padEnd(maxLength, ' ');
    }

    _show_data() {
      if (this._priceData.length == 0) {
        return;
      }

      const index = this._turn % this._priceData.length;
      const data = this._priceData[index];
      this._log(['Switching to', data.name]);
      const prefix = data.index;
      const prefixColor = data.color;
      const latest_price = this._format_num_unit(data.price, data.name, this._priceData.map(p => [p.price, p.name]));
      const latest_change = this._format_num_unit(data.change, data.name, this._priceData.map(p => [p.change, p.name]));
      const latest_pchange = this._format_num_unit(data.pchange, data.name, this._priceData.map(p => [p.pchange, p.name]));
      const change = data.change;
      this._turn = (this._turn + 1) % this._priceData.length;

      const color = change > 0 ? 'green' : 'red';
      const sign = change > 0 ? '+' : '-';
      this.price.set_text(`<span font_family="monospace">:<span foreground="${prefixColor}">${prefix}</span>: ${latest_price} <span foreground="${color}">${sign}${latest_change} ${sign}${latest_pchange}%</span></span>`);
      this.price.clutter_text.set_use_markup(true);
    }

    _fetch_data() {
      if (this.lock) {
        this._log(['Fetch in progress']);
        return;
      }
      this.lock = true;

      const enabledSource = this._settings.get_string('enabled-source');
      const source = SourceMappings.get(enabledSource);
      this._fetcher = new Fetcher(source!, this._log.bind(this));
      this._fetcher.fetch(this._settings, (result => {
        this._fetcher = undefined;
        if (!result) {
          this.lock = false;
          return;
        }

        let ounceGoldPriceData: PriceData | undefined;
        let ounceSilverPriceData: PriceData | undefined;
        const priceData: PriceData[] = [];
        Object.entries(MetalMappings).forEach(([name, display]) => {
          const data = result.get(name);
          if (!data) {
            this.lock = false;
            return;
          }

          const pd = {
            name: name,
            index: display.name,
            color: display.color,
            price: data.get('price')!,
            change: data.get('change')!,
            pchange: data.get('pchange')!,
          };

          priceData.push(pd);
          if (name == 'gold') {
            ounceGoldPriceData = pd;
          } else if (name == 'silver') {
            ounceSilverPriceData = pd;
          }
        });

        const gold = this._settings.get_int('gold-ownership');
        if (gold > 0 && ounceGoldPriceData) {
          const goldType = this._settings.get_int('gold-ownership-unit');
          const ownedGold: PriceData = {
            name: 'gold',
            index: 'OG',
            color: MetalMappings.gold.color,
            price: this._get_unit_price_from_ounce(ounceGoldPriceData.price, goldType) * gold,
            change: this._get_unit_price_from_ounce(ounceGoldPriceData.change, goldType) * gold,
            pchange: ounceGoldPriceData.pchange,
          };
          priceData.push(ownedGold);
        }
        const silver = this._settings.get_int('silver-ownership');
        if (silver > 0 && ounceSilverPriceData) {
          const silverType = this._settings.get_int('silver-ownership-unit');
          const ownedSilver: PriceData = {
            name: 'silver',
            index: 'OS',
            color: MetalMappings.silver.color,
            price: this._get_unit_price_from_ounce(ounceSilverPriceData.price, silverType) * silver,
            change: this._get_unit_price_from_ounce(ounceSilverPriceData.change, silverType) * silver,
            pchange: ounceSilverPriceData.pchange,
          };
          priceData.push(ownedSilver);
        }

        this._priceData = priceData;
        this.lastUpdate.label_actor.text = "Last update: " + new Date().toLocaleTimeString();
        const next_update = Date.now() + this._get_refresh_interval() * 60 * 1000;
        const next_update_str = new Date(next_update).toLocaleTimeString();
        this.refreshBtn.label.set_text(`Refresh [Next update: ${next_update_str}]`);

        this.lock = false;
        this._show_data();
      }));
    }

    _log(logs: string[]) {
      if (this._settings?.get_boolean('enable-debug-logging')) {
        console.log("[PriceMonitor]", logs.join(", "));
      }
    }

    destroy() {
      if (this._fetcher) {
        this._fetcher.disable();
        this._fetcher = undefined;
      }
      // Remove the background taks
      GLib.source_remove(this.backgroundTask);
      GLib.source_remove(this.showTask);
      super.destroy();
    }
  }
);

export default class PriceIndicatorExtension extends Extension {
  private _settings?: Gio.Settings;
  private _indicator?: Indicator;

  enable() {
    this._settings = this.getSettings();
    this._indicator = new Indicator(this, this._settings!);
    this.addToPanel(this._settings!.get_int('panel-position'));

    ["refresh-interval", "panel-position"].forEach((key) => {
      this._settings!.connect(`changed::${key}`, () => {
        this.disable();
        this.enable();
      });
    });
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = undefined;
    }
    this._settings = undefined;
  }

  addToPanel(indicator_position: number) {
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
