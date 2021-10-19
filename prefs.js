const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;

function init () {
}

function buildPrefsWidget () {
  const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.pcalc');

  const list = new Gtk.ListBox({
    selection_mode: Gtk.SelectionMode.NONE,
    show_separators: true,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.START,
    hexpand: true,
    margin_start: 60,
    margin_end: 60,
    margin_top: 60,
    margin_bottom: 60
  });

  _makeToggleRow(
    settings,
    'allow-entry-on-panel',
    'Enable entry of expressions directly on the panel',
    list);

  _makeToggleRow(
    settings,
    'show-help-on-popup',
    'Show help on popup',
    list);

  return list;
}

function _makeToggleRow (settings, settingId, settingText, list) {
  const label = new Gtk.Label({
    label: settingText,
    hexpand: true,
    halign: Gtk.Align.START
  });

  const toggle = new Gtk.Switch({
    active: settings.get_boolean(settingId),
    margin_start: 20,
    halign: Gtk.Align.END,
    visible: true
  });

  settings.bind(
    settingId,
    toggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  const hbox = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 10,
    margin_start: 10,
    margin_end: 10,
    margin_top: 10,
    margin_bottom: 10
  });

  const row = new Gtk.ListBoxRow({
    child: hbox
  });

  hbox.append(label);
  hbox.append(toggle);
  list.append(row);
}
