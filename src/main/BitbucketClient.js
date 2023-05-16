const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ClientOperation = Me.imports.src.main.ClientOperation;

const logger = new Me.imports.src.util.Logger.Logger('BitbucketClient');


class _BitbucketClient {

    #url;
    #authToken;
    #httpSession;

    #operations


    constructor(url, authToken, timeout) {
        // field property is used to define the relevant fields to obtain data from. This allows normalization between multiple clients
        this.#operations = new Map([
            [ClientOperation.ClientOperation.PullRequestCount, { path:'/rest/api/latest/inbox/pull-requests/count', action:'GET', field:'count' }],
        ])

        this.#httpSession = new Soup.SessionAsync();
        this.#httpSession['timeout'] = timeout;
        
        this.#url = url.endsWith("/") ? url.slice(0, -1) : url
        this.#authToken = !authToken.startsWith("Bearer ") ? "Bearer " + authToken : authToken;
    }

    getOperationPromise(operation) {
        if(!this.#operations.has(operation)){
            logger.info(operation + " not supported");
            return { code: 418, body: { error: 'e' } };
        }
        
        // Some variables/methods need to be re-assigned for injection
        let clientProperties = this.#operations.get(operation);
        let httpSession = this.#httpSession;
        let buildResponse = this.#buildResponse;

        let request = Soup.Message.new(clientProperties['action'], this.#url + clientProperties['path']);
        
        request.request_headers.append('Authorization', this.#authToken)
        request.request_headers.set_content_type("application/json", null);

        let promise = new Promise(function(resolve, reject) {
            try {
                httpSession.queue_message(request, (_, response) => {
                    resolve(buildResponse(operation, response, clientProperties));
                });
            }
            catch (err) {
                reject(buildResponse(_, _, _, err));
            }
        });

        return promise;
    }

    #buildResponse(operation, apiResponse, clientProperties, err = null){
        let clientResponse = {};
        if(err != null){
            logger.error(err);
            clientResponse['code'] = 418;
            clientResponse['body'] = { error: "e" }
            return clientResponse;
        }

        clientResponse['code'] = apiResponse.status_code;
        switch(apiResponse.status_code){
            case 401:
                clientResponse['body'] = { error: "a" };
                break
            case 404:
                clientResponse['body'] = { error: "n" };
                break
            case 500:
                clientResponse['body'] = { error: "g" };
                break
            case 200:
                let clientResponseBody = {};
                let apiResponseBody = JSON.parse(apiResponse.response_body.data);
                clientResponseBody[operation.response] = apiResponseBody[clientProperties['field']];
                clientResponse['body'] = clientResponseBody;
                break;
            default:
                clientResponse['body'] = { error: "f" };
                break;
        }
        return clientResponse;
    }

}

var BitbucketClient = class BitbucketClient extends _BitbucketClient {
    constructor(url, authToken, timeout) {
        super(url, authToken, timeout);
        Object.assign(this, url, authToken, timeout);
    }
};