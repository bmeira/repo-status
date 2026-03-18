import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class RepoStatusPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // --- Page ---
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // --- Connection group ---
        const group = new Adw.PreferencesGroup({
            title: 'Connection',
            description: 'Configure the Git server connection',
        });
        page.add(group);

        // URL row
        const urlRow = new Adw.EntryRow({
            title: 'Server URL',
            text: settings.get_string('repo-url'),
            show_apply_button: true,
        });
        urlRow.connect('apply', () => {
            settings.set_string('repo-url', urlRow.get_text());
        });
        group.add(urlRow);

        // Token row
        const tokenRow = new Adw.PasswordEntryRow({
            title: 'Auth Token',
            text: settings.get_string('auth-token'),
            show_apply_button: true,
        });
        // PasswordEntryRow doesn't have show_apply_button, so we listen for changes
        // We'll use a manual apply approach with a button instead.
        group.add(tokenRow);

        // Save button for token (PasswordEntryRow has no apply signal)
        const saveButton = new Gtk.Button({
            label: 'Save Token',
            css_classes: ['suggested-action'],
            margin_top: 12,
            halign: Gtk.Align.END,
        });
        saveButton.connect('clicked', () => {
            settings.set_string('auth-token', tokenRow.get_text());
        });
        group.add(saveButton);

        // --- Polling group ---
        const pollingGroup = new Adw.PreferencesGroup({
            title: 'Polling',
            description: 'Configure how often notifications are fetched',
        });
        page.add(pollingGroup);

        // Request interval row
        const intervalAdjustment = new Gtk.Adjustment({
            lower: 30,
            upper: 86400,
            step_increment: 30,
            page_increment: 300,
            value: settings.get_int('api-request-interval'),
        });

        const intervalRow = new Adw.SpinRow({
            title: 'Polling Interval (seconds)',
            subtitle: 'How often to check for new notifications (30–86400)',
            adjustment: intervalAdjustment,
        });
        intervalRow.connect('notify::value', () => {
            settings.set_int('api-request-interval', intervalRow.get_value());
        });
        pollingGroup.add(intervalRow);

        // --- Behaviour group ---
        const behaviourGroup = new Adw.PreferencesGroup({
            title: 'Behaviour',
            description: 'Configure extension visibility and notifications',
        });
        page.add(behaviourGroup);

        // Hide when zero
        const hideRow = new Adw.SwitchRow({
            title: 'Hide When No Notifications',
            subtitle: 'Hide the panel icon when the notification count is 0',
            active: settings.get_boolean('hide-extension'),
        });
        settings.bind(
            'hide-extension',
            hideRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        behaviourGroup.add(hideRow);

        // Show notifications
        const notifyRow = new Adw.SwitchRow({
            title: 'Desktop Notifications',
            subtitle: 'Show a desktop notification when the count increases',
            active: settings.get_boolean('show-notifications'),
        });
        settings.bind(
            'show-notifications',
            notifyRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        behaviourGroup.add(notifyRow);
    }
}


