const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const RepoStatusExtension = Me.imports.src.RepoStatusExtension;


let indicator;


function init() {
}

function enable() {
    log('[repo-status][info] enabled');
    indicator = new RepoStatusExtension.RepoStatusExtension();
    indicator.start();
}

function disable() {
    log('[repo-status][info] disabled');
    indicator.stop();
}
