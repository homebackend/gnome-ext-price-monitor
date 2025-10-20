import Gio from "gi://Gio";
import Adw, { SpinRow } from "gi://Adw";
import Gtk from "gi://Gtk";

import { ExtensionPreferences, gettext as _ } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { CurrencyMappings, SourceMappings } from "./source.js";

export default class PriceMonitorPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    const settings: Gio.Settings = this.getSettings();
    // Create a preferences page, with a single group
    const page = new Adw.PreferencesPage({
      title: _("Gold Price Monitor - Settings"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(page);

    page.add(this._create_source_options(settings));
    page.add(this._create_ownership_options(settings));
    page.add(this._create_weight_unit_options(settings));
    page.add(this._create_currency_unit_options(settings));
    page.add(this._create_refresh_interval_options(settings));
    page.add(this._create_panel_position_options(settings));
    page.add(this._add_developer_settings(settings));
  }

  private _create_source_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const sourceGroup = new Adw.PreferencesGroup({
      title: 'Source Options',
      description: 'Options related to source for prices and data',
    });
    const schema = settings.settings_schema;
    const keyObject = schema.get_key('enabled-source');

    const options: string[] = [];
    const optionDescription: string[] = [];
    const comboModel = new Gtk.StringList();
    SourceMappings.forEach((source, key) => {
      options.push(key);
      optionDescription.push([...source.commodities.keys()].join(','));
      comboModel.append(key);
    });

    const comboRow = new Adw.ComboRow({
      title: keyObject.get_summary()!,
      subtitle: keyObject.get_description()!,
      model: comboModel,
    });

    const initialValue = settings.get_string('enabled-source');
    const initialIndex = options.indexOf(initialValue);
    if (initialIndex !== -1) {
      comboRow.selected = initialIndex;
    }

    const infoRow = new Adw.ActionRow({
      title: "Related Information",
      subtitle: initialIndex >= 0 ? `${options[initialIndex]} supports: ${optionDescription[initialIndex]}` : 'Please select an option'
    });

    comboRow.connect('notify::selected', () => {
      const selectedIndex = comboRow.selected;
      const selectedOption = options[selectedIndex];
      settings.set_string('enabled-source', selectedOption);
      infoRow.subtitle = `${options[selectedIndex]} supports: ${optionDescription[selectedIndex]}`;
    });

    sourceGroup.add(comboRow);
    sourceGroup.add(infoRow);

    return sourceGroup;
  }

  private _create_combo_row(settings: Gio.Settings, group: Adw.PreferencesGroup, key: string, values: string[], displayValues: string[] | undefined = undefined) {
    const schema = settings.settings_schema;
    const keyObject = schema.get_key(key);
    const model = new Gtk.StringList();
    (displayValues ? displayValues : values).forEach((value) => model.append(value));

    const row = new Adw.ComboRow({
      title: keyObject.get_summary()!,
      subtitle: keyObject.get_description()!,
      model: model,
    });
    if (displayValues) {
      row.connect('notify::selected', () => {
        const selectedOption = values[row.selected];
        settings.set_string(key, selectedOption);
      });
    } else {
      settings.bind(key, row, "selected", Gio.SettingsBindFlags.NO_SENSITIVITY);
    }
    group.add(row);
  }

  private _create_spin_row(settings: Gio.Settings, group: Adw.PreferencesGroup, key: string, minimum: number, maximum: number, increment: number = 1) {
    const schema = settings.settings_schema;
    const keyObject = schema.get_key(key);
    const row = new Adw.SpinRow({
      title: keyObject.get_summary()!,
      subtitle: keyObject.get_description()!,
      adjustment: new Gtk.Adjustment({
        lower: minimum,
        upper: maximum,
        step_increment: increment,
      }),
    });
    settings.bind(key, row, "value", Gio.SettingsBindFlags.DEFAULT);

    group.add(row);
  }

  private _create_ownership_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const group = new Adw.PreferencesGroup({ title: "Ownership details" });
    ['gold', 'silver'].forEach(k => {
      this._create_spin_row(settings, group, `${k}-ownership`, 0, 1000000);
      this._create_combo_row(settings, group, `${k}-ownership-unit`, ["Ounce(℥)", "Gram(g)", "Kilogram(kg)", "Tola"]);
    });

    return group;
  }

  private _create_weight_unit_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const weightGroup = new Adw.PreferencesGroup({ title: "Weight Unit" });

    ['gold', 'silver', 'platinum', 'palladium', 'rhodium'].forEach(k => {
      this._create_combo_row(settings, weightGroup, `${k}-weight-unit`, ["Ounce(℥)", "Gram(g)", "Kilogram(kg)", "Tola"]);
    });

    return weightGroup;
  }

  private _create_currency_unit_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const currencyGroup = new Adw.PreferencesGroup({ title: "Currency" });
    this._create_combo_row(settings, currencyGroup, 'currency', [...CurrencyMappings.keys()], [...CurrencyMappings.values()]);
    return currencyGroup;
  }

  private _create_refresh_interval_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const refreshGroup = new Adw.PreferencesGroup({ title: "Refresh Interval" });
    this._create_spin_row(settings, refreshGroup, 'refresh-interval', 1, 120);
    return refreshGroup;
  }

  private _create_panel_position_options(settings: Gio.Settings): Adw.PreferencesGroup {
    const positionGroup = new Adw.PreferencesGroup({ title: "Panel Position" });
    this._create_combo_row(settings, positionGroup, 'panel-position', ["Left", "Center", "Right"]);
    return positionGroup;
  }

  private _add_check_box_setting_row(group: Adw.PreferencesGroup, key: string, settings: Gio.Settings) {
    const schema = settings.settings_schema;
    const keyObject = schema.get_key(key);
    const row = new Adw.ActionRow({
      title: keyObject.get_summary()!,
      subtitle: keyObject.get_description()!,
    });
    group.add(row);

    const checkButton = new Gtk.CheckButton({
      halign: Gtk.Align.CENTER, // Prevent horizontal expansion
      valign: Gtk.Align.CENTER, // Prevent vertical expansion
    });
    row.add_suffix(checkButton);

    settings.bind(key, checkButton, 'active', Gio.SettingsBindFlags.DEFAULT);
  }

  private _add_developer_settings(settings: Gio.Settings): Adw.PreferencesGroup {
    const group = new Adw.PreferencesGroup({
      title: 'Developer Options',
      description: 'Control developer mode used to debug this extension.'
    });

    this._add_check_box_setting_row(group, 'enable-debug-logging', settings);
    return group;
  }
}
