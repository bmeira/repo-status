"use strict";

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() { }

function buildPrefsWidget() {

    this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.repo-status');

    let prefsWidget = new Gtk.Grid({
        "margin-start": 18,
        "margin-end": 18,
        "margin-top": 18,
        "margin-bottom": 18,
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
    });

    let title = new Gtk.Label({
        label: `<b>${Me.metadata.name} Preferences</b>`,
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 2, 1);

    buildComponent(1, "Authentication token", new Gtk.Entry(), prefsWidget, this.settings, "auth-token");
    buildComponent(2, "Repository url", new Gtk.Entry(), prefsWidget, this.settings, "repo-url");
    buildComponent(3, "PR count path", new Gtk.Entry(), prefsWidget, this.settings, "api-pr-count-path");
    buildComponent(4, "PR count field", new Gtk.Entry(), prefsWidget, this.settings, "api-pr-count-property");
    buildComponent(5, "Request interval (seconds)", new Gtk.Entry(), prefsWidget, this.settings, "api-request-interval");
    buildComponent(6, "Request timeout (seconds)", new Gtk.Entry(), prefsWidget, this.settings, "api-request-timeout");
    buildComponent(7, "Notifications", new Gtk.Switch(), prefsWidget, this.settings, "show-notifications");

    return prefsWidget;
}

function buildComponent(position, labelText, component, widgetWindow, settings, key){
    let label = new Gtk.Label({
        label: labelText + ": ",
        halign: Gtk.Align.START,
        visible: true
    });
    widgetWindow.attach(label, 0, position, 1, 1);

    component['halign'] = Gtk.Align.END;
    component['visible'] = true;
    widgetWindow.attach(component, 1, position, 1, 1);

    let bindTo = component instanceof Gtk.Switch ? "active" : "text";

    settings.bind(key, component, bindTo, Gio.SettingsBindFlags.DEFAULT);
}