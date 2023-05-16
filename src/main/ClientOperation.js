class _ClientOperation {
    static PullRequestCount = new _ClientOperation("pullRequestCount", "count");

    #description;
    #response; // field to place the actual response from the client - normalizes response structure between multiple clients

    constructor(description, response){
        this.description = description;
        this.response = response;
    }
}

var ClientOperation = class ClientOperation extends _ClientOperation {
    constructor(description, response) {
        super(description, response);
        Object.assign(this, description, response);
    }
};