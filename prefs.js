const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;

function init () {
}

function buildPrefsWidget () {
  const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.tbcalc');

  const hbox = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 10,
    margin_start: 10,
    margin_end: 10,
    margin_top: 10,
    margin_bottom: 10
  });

  const label = new Gtk.Label({
    label: 'Enable entry of expressions directly in the taskbar',
    hexpand: true,
    halign: Gtk.Align.START
  });

  const toggle = new Gtk.Switch({
    active: settings.get_boolean('allow-entry-on-taskbar'),
    halign: Gtk.Align.END,
    visible: true
  });

  settings.bind(
    'allow-entry-on-taskbar',
    toggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  const preferencesVbox = new Gtk.Box({
    name: 'preferences-vbox',
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 8,
    margin_start: 80,
    margin_end: 80,
    margin_top: 30,
    margin_bottom: 30
  });

  if (imports.gi.versions.Gtk === '4.0') {
    hbox.append(label);
    hbox.append(toggle);
    preferencesVbox.append(hbox);
  } else {
    pack_start(label, true, true, 0);
    pack_start(toggle, false, false, 0);
    preferencesVbox.pack_start(hbox, true, false, 0);
  }

  return preferencesVbox;
}
