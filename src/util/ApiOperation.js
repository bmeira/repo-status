class _ApiOperation {
    static PullRequestCount = new _ApiOperation("pullRequestCount", "count");

    #description;
    #response; // field to get response from inside body - normalizes response structure between multiple clients

    constructor(description, response){
        this.description = description;
        this.response = response;
    }
}

var ApiOperation = class ApiOperation extends _ApiOperation {
    constructor(description, response) {
        super(description, response);
        Object.assign(this, description, response);
    }
};