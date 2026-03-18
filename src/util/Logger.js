export class Logger {
    #clazz;
    #extensionName;
    #debugMode;

    constructor(clazz, debugEnabled = false) {
        this.#clazz = `[${clazz}]`;
        this.#extensionName = '[repo-status]';
        this.#debugMode = debugEnabled;
    }

    info(message) {
        console.log(`${this.#extensionName}${this.#clazz}[INFO] ${message}`);
    }

    error(message) {
        console.error(`${this.#extensionName}${this.#clazz}[ERROR] ${message}`);
    }

    debug(message) {
        if (this.#debugMode) {
            console.debug(`${this.#extensionName}${this.#clazz}[DEBUG] ${message}`);
        }
    }

    warn(message) {
        console.warn(`${this.#extensionName}${this.#clazz}[WARN] ${message}`);
    }
}

export default Logger;