class _Logger {

    #clazz;
    #extensionName;

    constructor(clazz){
        this.#clazz = '[' + clazz + ']';
        this.#extensionName = '[repo-status]'
    }

    info(message){
        global.log(this.#extensionName + this.#clazz + '[info] ' + message);
    }

    error(message){
        global.log(this.#extensionName + this.#clazz + '[error] ' + message);
    }
}

var Logger = class Logger extends _Logger {
    constructor(clazz) {
        super(clazz);
        Object.assign(this, clazz);
    }
};