"use strict";

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const RepoStatusExtension = Me.imports.src.RepoStatusExtension;

let indicator;
let indicatorName;


function init() {
    indicatorName = `${Me.metadata.name} Indicator`;
    log(`initializing ${Me.metadata.name}`);
}

function enable() {
    log("enabled");
    this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.repo-status');
    indicator = new RepoStatusExtension.RepoStatusExtension(0.0, indicatorName);
    Main.panel.addToStatusArea(indicatorName, indicator);
}

function disable() {
    log("disabled");
    indicator.clearLoop();
    indicator.destroy();
}