const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ApiOperation = Me.imports.src.util.ApiOperation;

const logger = new Me.imports.src.util.Logger.Logger('BitbucketApiWrapper');


class _BitbucketApiWrapper {

    #url;
    #authToken;
    #httpSession;

    #apiOperations;


    constructor(url, authToken, timeout) {
        // field property is used to map the response structure from the client (inside body) to a common response structure (client independent)
        this.#apiOperations = new Map([
            [ApiOperation.ApiOperation.PullRequestCount, { path:'/rest/api/latest/inbox/pull-requests/count', action:'GET', field:'count' }],
        ])

        this.#httpSession = new Soup.SessionAsync();
        this.#httpSession['timeout'] = timeout;
        
        this.#url = url.endsWith("/") ? url.slice(0, -1) : url
        this.#authToken = !authToken.startsWith("Bearer ") ? "Bearer " + authToken : authToken;
    }

    getCallPromise(apiOperation) {
        if(!this.#apiOperations.has(apiOperation)){
            logger.info(apiOperation + " not supported");
            return { code: 418, body: { error: 'e' } };
        }
        
        // Some variables/methods need to be mapped for injection
        let clientProperties = this.#apiOperations.get(apiOperation);
        let httpSession = this.#httpSession;
        let buildResponse = this.#buildResponse;

        let request = Soup.Message.new(clientProperties['action'], this.#url + clientProperties['path']);
        
        request.request_headers.append('Authorization', this.#authToken)
        request.request_headers.set_content_type("application/json", null);

        let promise = new Promise(function(resolve, reject) {
            try {
                httpSession.queue_message(request, (_, response) => {
                    resolve(buildResponse(apiOperation, response, clientProperties));
                });
            }
            catch (err) {
                reject(_, _, _, err);
            }
        });

        return promise;
    }

    #buildResponse(apiOperation, apiResponse, clientProperties, err = null){
        let wrapperResponse = {};
        if(err != null){
            logger.error(err);
            wrapperResponse['code'] = 418;
            wrapperResponse['body'] = { error: "e" }
            return wrapperResponse;
        }

        wrapperResponse['code'] = apiResponse.status_code;
        switch(apiResponse.status_code){
            case 401:
                wrapperResponse['body'] = { error: "a" };
                break
            case 404:
                wrapperResponse['body'] = { error: "n" };
                break
            case 500:
                wrapperResponse['body'] = { error: "g" };
                break
            case 200:
                let wrapperResponseBody = {};
                let apiResponseBody = JSON.parse(apiResponse.response_body.data);
                wrapperResponseBody[apiOperation.response] = apiResponseBody[clientProperties['field']];
                wrapperResponse['body'] = wrapperResponseBody;
                break;
            default:
                wrapperResponse['body'] = { error: "f" };
                break;
        }
        return wrapperResponse;
    }

}

var BitbucketApiWrapper = class BitbucketApiWrapper extends _BitbucketApiWrapper {
    constructor(url, authToken, timeout) {
        super(url, authToken, timeout);
        Object.assign(this, url, authToken, timeout);
    }
};