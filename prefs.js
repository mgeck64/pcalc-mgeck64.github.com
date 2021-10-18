const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;

function init () {
}

function _makeHbox () {
  return new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 10,
    margin_start: 10,
    margin_end: 10,
    margin_top: 10,
    margin_bottom: 10
  });
}

function buildPrefsWidget () {
  const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.tbcalc');

  // callow-entry-on-taskbar:

  const entryLabel = new Gtk.Label({
    label: 'Enable entry of expressions directly in the taskbar',
    hexpand: true,
    halign: Gtk.Align.START
  });

  const entryToggle = new Gtk.Switch({
    active: settings.get_boolean('allow-entry-on-taskbar'),
    halign: Gtk.Align.END,
    visible: true
  });

  settings.bind(
    'allow-entry-on-taskbar',
    entryToggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  // setting for show-help-on-popup:

  const helpLabel = new Gtk.Label({
    label: 'Show help on popup',
    hexpand: true,
    halign: Gtk.Align.START
  });

  const helpToggle = new Gtk.Switch({
    active: settings.get_boolean('show-help-on-popup'),
    halign: Gtk.Align.END,
    visible: true
  });

  settings.bind(
    'show-help-on-popup',
    helpToggle,
    'active',
    Gio.SettingsBindFlags.DEFAULT
  );

  // finish:

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
    let hbox = _makeHbox();
    hbox.append(entryLabel); hbox.append(entryToggle);
    preferencesVbox.append(hbox);

    hbox = _makeHbox();
    hbox.append(helpLabel); hbox.append(helpToggle);
    preferencesVbox.append(hbox);
  } else {
    let hbox = _makeHbox();
    pack_start(entryLabel, true, true, 0); pack_start(entryToggle, false, false, 0);
    preferencesVbox.pack_start(hbox, true, false, 0);

    hbox = _makeHbox();
    pack_start(helpLabel, true, true, 0); pack_start(helpToggle, false, false, 0);
    preferencesVbox.pack_start(hbox, true, false, 0);
  }

  return preferencesVbox;
}
