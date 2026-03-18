import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Only export one consistent function name
export function getModuleImport(relativePath) {
    const self = Gio.File.new_for_uri(import.meta.url);
    const parent = self.get_parent();
    const basePath = parent.get_path();
    const fullPath = `${basePath}/${relativePath}`.replace(/\/+/g, '/');
    return `file://${fullPath}`;
}

export function getExtensionPath() {
    // Using Gio.File for reliable path resolution
    const self = Gio.File.new_for_uri(import.meta.url);
    const parent = self.get_parent();
    return parent.get_path();
}

export function getSettings() {
    const schemaId = 'org.gnome.shell.extensions.repo-status';
    const schemaDir = `${getExtensionPath()}/schemas`;
    
    // Try system schema first
    try {
        return new Gio.Settings({ schema_id: schemaId });
    } catch (e) {
        console.log('System schema not found, trying local schema');
    }

    // Fallback to local schema
    const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
        schemaDir,
        Gio.SettingsSchemaSource.get_default(),
        false
    );
    const schema = schemaSource.lookup(schemaId, false);
    
    if (!schema) {
        throw new Error(`Schema ${schemaId} not found in ${schemaDir}`);
    }
    
    return new Gio.Settings({ settings_schema: schema });
}

// Debugging
const debugPath = getExtensionPath();
console.log(`Extension path: ${debugPath}`);
console.log(`Sample import: file://${debugPath}/src/main/GitClient.js`);