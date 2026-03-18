import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';

function getExtensionPath() {
    const metaUrl = import.meta.url;
    if (!metaUrl.startsWith('file://')) {
        throw new Error('Extension path is not a file URL');
    }
    
    const path = GLib.path_get_dirname(
        metaUrl.substring('file://'.length)
    );
    
    // Remove any trailing slashes
    return path.replace(/\/$/, '');
}

const extensionPath = getExtensionPath();

let RepoStatusCore;
let Logger;
try {
    ({ Logger } = await import(`file://${extensionPath}/src/util/Logger.js`));
    ({ RepoStatusExtension: RepoStatusCore } = await import(`file://${extensionPath}/src/main/RepoStatusExtension.js`));
} catch (error) {
    console.error('Failed to import extension modules:', error);
    throw error;
}

const logger = new Logger('Extension');
let indicator = null;

// Main extension class
export default class RepoStatusExtension extends Extension {
    enable() {
        logger.info('Enabling extension');
        try {
            indicator = new RepoStatusCore();
            indicator.start(true);
        } catch (error) {
            logger.error(`Failed to enable: ${error}`);
            throw error;
        }
    }

    disable() {
        logger.info('Disabling extension');
        if (indicator) {
            try {
                indicator.stop(true);
            } catch (error) {
                logger.error(`Failed to cleanly disable: ${error}`);
            }
            indicator = null;
        }
    }
}