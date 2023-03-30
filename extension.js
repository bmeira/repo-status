const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const RepoStatusExtension = Me.imports.src.main.RepoStatusExtension.RepoStatusExtension;


const logger = new Me.imports.src.util.Logger.Logger('Extension');
let indicator;


function init() {
}

function enable() {
    logger.info('enabled');
    indicator = new RepoStatusExtension();
    indicator.start(true);
}

function disable() {
    logger.info('disabled');
    indicator.stop(true);
}
