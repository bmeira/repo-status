import St from 'gi://St';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';


import { getExtensionPath, getSettings } from '../../utils.js';

// Get paths
const extensionPath = getExtensionPath();
const gitClientPath = `file://${extensionPath}/src/main/GitClient.js`;
const loggerPath = `file://${extensionPath}/src/util/Logger.js`;
const clientOperationPath = `file://${extensionPath}/src/main/ClientOperation.js`;

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const { GitClient } = await import(gitClientPath);
const { Logger } = await import(loggerPath);
const { ClientOperation } = await import(clientOperationPath);

const logger = new Logger('RepoStatusExtension');

export class RepoStatusExtension {
    #gitClient;
    #timeout;
    #isInit;
    #box;
    #icon;
    #label;
    #notifications;
    #leftMenu;
    #rightMenu;
    #settings;

    constructor() {
        this.#isInit = false;
        this.#notifications = [];
        this.#settings = getSettings();
    }

    start(freshStart) {
        if (!this.#isInit) {
            this.#setupClients();
            this.#init(freshStart);
        }
        Main.panel._rightBox.insert_child_at_index(this.#box, 0);
        this.#box.visible = true;
        this.#scheduleRequest(ClientOperation.PullRequestCount);
    }

    stop(fullStop) {
        this.clearLoop();
        if (fullStop) {
            if (this.#leftMenu) {
                this.#leftMenu.destroy();
                this.#leftMenu = null;
            }
            if (this.#rightMenu) {
                this.#rightMenu.destroy();
                this.#rightMenu = null;
            }
            Main.panel._rightBox.remove_child(this.#box);
        }
        this.#isInit = false;
    }

    clearLoop() {
        if (this.#timeout) {
            GLib.Source.remove(this.#timeout);
            this.#timeout = null;
        }
    }

    #init(freshStart) {
        if (freshStart) this.#setupUi();
        this.#isInit = true;
    }

    #setupClients() {
        const url = this.#settings.get_string('repo-url');
        const token = this.#settings.get_string('auth-token');

        this.#gitClient = new GitClient(url, token, 5);
    }

    #setupUi() {
        this.#box = new St.BoxLayout({
            style_class: 'panel-button',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.#icon = new St.Icon({
            gicon: Gio.icon_new_for_string(`${extensionPath}/icons/github.png`),
            style_class: 'system-status-icon',
            icon_size: 16
        });

        this.#label = new St.Label({
            text: '…',
            style_class: 'system-status-icon notifications-length',
            y_align: Clutter.ActorAlign.CENTER,
            y_expand: true,
        });

        this.#box.add_child(this.#icon);
        this.#box.add_child(this.#label);

        // Use a menu manager so that clicking outside auto-closes the menu
        this._menuManager = new PopupMenu.PopupMenuManager(this.#box);

        // --- Left-click menu: list of notifications ---
        this.#leftMenu = new PopupMenu.PopupMenu(this.#box, 0.0, St.Side.TOP, 0);
        Main.uiGroup.add_child(this.#leftMenu.actor);
        this.#leftMenu.actor.hide();
        this._menuManager.addMenu(this.#leftMenu);

        // --- Right-click menu: Refresh & Settings ---
        this.#rightMenu = new PopupMenu.PopupMenu(this.#box, 0.0, St.Side.TOP, 0);

        const refreshItem = new PopupMenu.PopupMenuItem('Refresh');
        refreshItem.connect('activate', () => {
            this.stop(false);
            this.start(false);
        });
        this.#rightMenu.addMenuItem(refreshItem);

        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => {
            try {
                const subprocess = Gio.Subprocess.new(
                    ['gnome-extensions', 'prefs', 'repo-status@kzd.homebrew.net'],
                    Gio.SubprocessFlags.NONE
                );
            } catch (err) {
                logger.error(`Unable to open settings: ${err}`);
            }
        });
        this.#rightMenu.addMenuItem(settingsItem);

        Main.uiGroup.add_child(this.#rightMenu.actor);
        this.#rightMenu.actor.hide();
        this._menuManager.addMenu(this.#rightMenu);

        // --- Click handler ---
        this.#box.connect('button-press-event', (_, event) => {
            const button = event.get_button();

            if (button === 1) {
                // Left click — toggle notifications menu
                this.#rightMenu.close();
                this.#rebuildLeftMenu();
                this.#leftMenu.toggle();
            } else if (button === 3) {
                // Right click — toggle settings menu
                this.#leftMenu.close();
                this.#rightMenu.toggle();
            }
        });
    }

    #rebuildLeftMenu() {
        this.#leftMenu.removeAll();

        if (this.#notifications.length === 0) {
            const emptyItem = new PopupMenu.PopupMenuItem('No notifications');
            emptyItem.setSensitive(false);
            this.#leftMenu.addMenuItem(emptyItem);
            return;
        }

        for (const { title, link } of this.#notifications) {
            const displayTitle = title.length > 20
                ? title.substring(0, 20) + '…'
                : title;

            const item = new PopupMenu.PopupMenuItem(displayTitle);
            item.connect('activate', () => {
                try {
                    Gio.AppInfo.launch_default_for_uri(link, null);
                } catch (err) {
                    logger.error(`Unable to open link: ${err}`);
                }
            });
            this.#leftMenu.addMenuItem(item);
        }
    }

    async #scheduleRequest(apiOperation) {
        this.clearLoop();
        try {
            const result = await this.#gitClient.getOperationPromise(apiOperation);
            const handled = this.#handleResponse(apiOperation, result);
            this.#maybeNotify(handled);
        } catch (error) {
            this.#handleResponse(apiOperation, null, error);
            this.#maybeNotify(error);
        }

        const interval = this.#settings.get_int('api-request-interval');
        this.#timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                this.#scheduleRequest(apiOperation);
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    #handleResponse(apiOperation, apiResponse, err = null) {
        if (err) {
            logger.error(err);
            this.#label.set_text('!');
            return null;
        }

        if (apiResponse.code !== 200) {
            const errDesc = apiResponse.body.errDesc || apiResponse.body.error || '?';
            logger.error(`API error ${apiResponse.code}: ${errDesc}`);
            this.#label.set_text('!');
            return null;
        }

        const nextValue = apiResponse.body[apiOperation.response];

        // Store notification data for the menus
        const titles = apiResponse.body[apiOperation.titles] || [];
        const links = apiResponse.body[apiOperation.links] || [];
        this.#notifications = titles.map((title, i) => ({
            title,
            link: links[i] || ''
        }));

        const values = {
            currentValue: this.#label.get_text().trim(),
            nextValue: nextValue
        };

        this.#label.set_text(`${nextValue}`);

        // Hide the panel button when count is 0 and the setting is enabled
        if (this.#settings.get_boolean('hide-extension')) {
            this.#box.visible = (Number(nextValue) > 0);
        } else {
            this.#box.visible = true;
        }

        return values;
    }

    #maybeNotify(notifValues) {
        // Skip if notifications are disabled in settings
        if (!this.#settings.get_boolean('show-notifications')) {
            return;
        }

        if (!notifValues || 
            isNaN(notifValues['nextValue']) || 
            Number(notifValues['nextValue']) < 1) {
            return;
        }

        if (!isNaN(notifValues['currentValue']) && 
            Number(notifValues['nextValue']) <= Number(notifValues['currentValue'])) {
            return;
        }

        const icon = Gio.icon_new_for_string('mail-drafts-symbolic');
        
        const source = new MessageTray.Source({
            title: 'Repository Status',
            icon: icon
        });

        Main.messageTray.add(source);

        const notification = new MessageTray.Notification({
            source: source,
            title: 'Repository Status',
            body: 'New PR pending approval'
        });

        source.addNotification(notification);
    }

}