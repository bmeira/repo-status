export class ClientOperation {
    static PullRequestCount = new ClientOperation("pullRequestCount", "count", "links", "titles");

    #description;
    #response;
    #links;
    #titles;

    constructor(description, response, links, titles) {
        this.#description = description;
        this.#response = response;
        this.#links = links;
        this.#titles = titles;
    }

    get description() {
        return this.#description;
    }

    get response() {
        return this.#response;
    }

    get links() {
        return this.#links;
    }

    get titles() {
        return this.#titles;
    }
}

