"use strict";

const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;

const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const BitbucketApiWrapper = Me.imports.src.BitbucketApiWrapper;



var RepoStatusExtension = GObject.registerClass(
    class RepoStatusExtension extends PanelMenu.Button {

        _appIcon;
        _label;
        
        _bitbucketApiWrapper;
        
        _settings;

        _init(menuAlignment, nameText) {
            super._init(menuAlignment, nameText, false);
            
            this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.repo-status');

            this._bitbucketApiWrapper = new BitbucketApiWrapper.BitbucketApiWrapper(
                this.getPropertyValue('repo-url'), 
                this.getPropertyValue('auth-token'), 
                parseInt(this.getPropertyValue('api-request-timeout')));

            this._scheduleApiRequest = this._scheduleApiRequest.bind(this);
            this._handleApiResponse = this._handleApiResponse.bind(this);

            let box = new St.BoxLayout({ style_class: "panel-status-menu-box" });

            this._appIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.path + "/icons/github.png"),
                style_class: "system-status-icon",
                icon_size: "16"
            });

            this._label = new St.Label({
                text: "l",
                style: "margin-top:5px;",
            });

            box.add_child(this._appIcon);
            box.add_child(this._label);
            this.add_child(box);

            this._scheduleApiRequest();
        }

        clearLoop() {
            if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
            }
        }

        async _scheduleApiRequest() {
            try {
                this.clearLoop();
                this._bitbucketApiWrapper.doApiCall(this.getPropertyValue('api-pr-count-path'), this._handleApiResponse);
            }
            catch (err) {
                log("error: " + err);
            }
            finally {
                this._timeout = Mainloop.timeout_add_seconds(parseInt(this.getPropertyValue('api-request-interval')), this._scheduleApiRequest);
            }
        }

        async _handleApiResponse(apiResponse, err = null) {
            if(err) log(err);

            let nextValue = apiResponse.code !== 200 ? apiResponse.body.error : apiResponse.body[this.getPropertyValue('api-pr-count-property')];
            let currentValue = this._label.get_text();
            
            if (this.getPropertyValue('show-notifications') && !isNaN(nextValue) && isNaN(currentValue) && Number(nextValue) > 0 || (!isNaN(currentValue) && !isNaN(nextValue) && Number(nextValue) > Number(currentValue))) {
                this.notify("New PR pending approval");
            }
            
            this._label.set_text(nextValue.toString());
        }

        async notify(message) {
            let source = new MessageTray.Source(Me.metadata.name, "mail-drafts-symbolic");
            Main.messageTray.add(source);
            let notification = new MessageTray.Notification(source, Me.metadata.name, message);
            notification.setTransient(false);
            source.showNotification(notification);
        }

        getPropertyValue(propertyKey){
            if(propertyKey === 'show-notifications') return this._settings.get_boolean(propertyKey);
            return this._settings.get_string(propertyKey) || null;
        }

    }
);