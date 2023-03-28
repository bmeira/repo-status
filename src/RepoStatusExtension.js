const { St, Gio, Gtk, GObject, Clutter } = imports.gi;
const { panelMenu, main, messageTray } = imports.ui;

const Mainloop = imports.mainloop;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const BitbucketApiWrapper = Me.imports.src.BitbucketApiWrapper;


class _RepoStatusExtension {

    #settings;
    #bitbucketApiWrapper;

    #timeout;
    #isInit

    #box;
    #icon;
    #label;


    constructor() {
        this.#settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.repo-status');
        this.#isInit = false;
    }

    start(freshStart) {
        if(!this.#isInit){
            this.#setupClients(); // Needs to be called separately from init
            this.#init(freshStart);
        }
        main.panel._rightBox.insert_child_at_index(this.#box, 0);
        this.#scheduleApiRequest();
    }

    stop(fullStop){
        this.clearLoop();
        if(fullStop) main.panel._rightBox.remove_child(this.#box);
        this.#isInit = false;
    }

    clearLoop() {
        if (this.#timeout) {
            Mainloop.source_remove(this.#timeout);
            this.#timeout = null;
        }
    }

    #init(freshStart){
        if(freshStart) this.#setupUi();
        this.#isInit = true;
    }

    #setupClients(){
        this.#bitbucketApiWrapper = new BitbucketApiWrapper.BitbucketApiWrapper(
            this.#getPropertyValue('repo-url'), 
            this.#getPropertyValue('auth-token'), 
            this.#getPropertyValue('api-request-timeout')
        );
    }

    #setupUi(){
        this.#box = new St.BoxLayout({ 
            style_class: 'panel-button',
            reactive: true,
            can_focus: true,
            track_hover: true
        });

        this.#icon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.path + "/icons/github.png"),
            style_class: "system-status-icon",
            icon_size: "16"
        });

        this.#label = new St.Label({
            text: "l",
            style_class: 'system-status-icon notifications-length',
            y_align: Clutter.ActorAlign.CENTER,
            y_expand: true,
        });

        this.#box.add_actor(this.#icon);
        this.#box.add_actor(this.#label);

        this.#box.connect('button-press-event', (_, event) => {
            let button = event.get_button();

            if (button == 1) {
                try{ Gtk.show_uri(null, this.#getPropertyValue('repo-url'), Gtk.get_current_event_time()); }
                catch (err) { this.#error("Unable to open link " + err); }
            } else if (button == 3) {
                this.stop(false);
                this.start(false);
            }
        });

    }

    #scheduleApiRequest() {
        this.clearLoop();
        this.#bitbucketApiWrapper.getCallPromise('GET', this.#getPropertyValue('api-pr-count-path'))
        .then(
            result => this.#handleApiResponse(result),
            error => this.#handleApiResponse(_, error)
        )
        .then(
            result => this.#maybeNotify(result),
            error => this.#maybeNotify(error)
        )
        .catch(err => this.#error(err));

        let interval = parseInt(this.#getPropertyValue('api-request-interval')); //should be validated/sanitized
        
        //this.#info("Scheduling next request in " + interval + " seconds")
        this.#timeout = Mainloop.timeout_add_seconds(interval, () => { 
            this.#scheduleApiRequest();
            return false;
        });
    }

    #handleApiResponse(apiResponse, err = null) {
        //this.#info("API Response --> " + JSON.stringify(apiResponse));
        if(err) {
            this.#error(err);
            return null;
        }

        let nextValue = apiResponse.code !== 200 ? apiResponse.body.error : apiResponse.body[this.#getPropertyValue('api-pr-count-property')];

        this.#box.visible = !this.#getPropertyValue('hide-extension') || nextValue != 0
        
        let values = {};
        values['currentValue'] = this.#label.get_text();
        values['nextValue'] = nextValue;

        this.#label.set_text(nextValue.toString());

        return values;
    }

    #maybeNotify(notifValues) {
        if(notifValues === null){
            this.#info("Got null notifs");
        }
        if(!this.#getPropertyValue('show-notifications')) return;
        if(isNaN(notifValues['nextValue'])) return;            
        if(Number(notifValues['nextValue']) < 1) return;

        if(!isNaN(notifValues['currentValue']) && Number(notifValues['nextValue']) <= Number(notifValues['nextValue'])) return;
    
        let message = "New PR pending approval";
        let source = new messageTray.Source(Me.metadata.name, "mail-drafts-symbolic");
        main.messageTray.add(source);
        let notification = new messageTray.Notification(source, Me.metadata.name, message);
        notification.setTransient(false);
        source.showNotification(notification);
    }

    #error(message){
        global.log('[repo-status][error] ' + message);
    }

    #info(message){
        global.log('[repo-status][info] ' + message);
    }

    #getPropertyValue(propertyKey){
        if(propertyKey === 'show-notifications' || propertyKey === 'hide-extension') return this.#settings.get_boolean(propertyKey);
        if(propertyKey === 'api-request-interval' || propertyKey == 'api-request-timeout') return this.#settings.get_int(propertyKey);
        return this.#settings.get_string(propertyKey) || null;
    }

}

var RepoStatusExtension = class RepoStatusExtension extends _RepoStatusExtension {
    constructor(params) {
        super();

        Object.assign(this, params);
    }
};
