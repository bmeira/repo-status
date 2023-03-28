const { Gtk, Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const SCHEMA = 'org.gnome.shell.extensions.repo-status';
const _settings = ExtensionUtils.getSettings(SCHEMA);


function init() { }

function buildPrefsWidget() {

    let mainBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        'margin-top': 20,
        'margin-bottom': 20,
        'margin-start': 20,
        'margin-end': 20,
        spacing: 10,
    });

    let widgets = [
        buildEntry('Repository url', 'repo-url'),
        buildEntry('Authentication token', 'auth-token'),
        buildEntry('PR count path', 'api-pr-count-path'),
        buildEntry('PR count field', 'api-pr-count-property'),
        buildSpin('Request interval (seconds)', 'api-request-interval', 30, 86400, 30),
        buildSpin('Request timeout (seconds)', 'api-request-timeout', 1, 5, 1),
        buildSwitch('Notifications','show-notifications'),
        buildSwitch('Hide extension','hide-extension'),
    ];

    for (let widget of widgets) {
        mainBox.append(widget);
    }

    return mainBox;
}


function buildBoxedLabel(text) {
    let box = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 10,
    });
    let label = new Gtk.Label({
        label: text
    });

    box.append(label);
    return box;
}

function buildSwitch(label, boundSetting) {
    let box = buildBoxedLabel(label);

    let gtkSwitch = new Gtk.Switch();
    bindSettingToWidget(boundSetting, gtkSwitch, 'state');

    box.append(gtkSwitch);
    return box;
}

function buildEntry(label, boundSetting) {
    let box = buildBoxedLabel(label);

    let entry = new Gtk.Entry();
    bindSettingToWidget(boundSetting, entry, 'text');

    box.append(entry);
    return box;
}

function buildSpin(label, boundSetting, min, max, increment) {
    const box = buildBoxedLabel(label);

    const spinButton = Gtk.SpinButton.new_with_range(min, max, increment);
    bindSettingToWidget(boundSetting, spinButton, 'value');

    box.append(spinButton);
    return box;
}

function bindSettingToWidget(setting, widget, property) {
    _settings.bind(setting, widget, property, Gio.SettingsBindFlags.DEFAULT);
}