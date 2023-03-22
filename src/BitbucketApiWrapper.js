const Lang = imports.lang;
const Soup = imports.gi.Soup;


var BitbucketApiWrapper = class {

    #url;
    #authToken;
    #httpSession;


    constructor(url, authToken, timeout) {
        this.#httpSession = new Soup.SessionAsync();
        this.#httpSession['timeout'] = timeout;
        
        this.#url = url;
        this.#authToken = authToken;
    }

    getCallPromise(action, path) {
        let request = Soup.Message.new(action, this.#url + path);
        let apiResponse = {};
        
        request.request_headers.append('Authorization', this.#authToken)
        request.request_headers.set_content_type("application/json", null);

        let httpSession = this.#httpSession;

        let promise = new Promise(function(resolve, reject) {
            try {
                httpSession.queue_message(request, (_, response) => {
                    apiResponse['code'] = response.status_code;
                    switch(response.status_code){
                        case 401:
                            apiResponse['body'] = { error: "a" };
                            break
                        case 404:
                            apiResponse['body'] = { error: "n" };
                            break
                        case 500:
                            apiResponse['body'] = { error: "g" };
                            break
                        case 200:
                            apiResponse['body'] = JSON.parse(response.response_body.data);
                            break;
                        default:
                            apiResponse['body'] = { error: "f" };
                            break;
                    }
                    resolve(apiResponse);
                });
            }
            catch (err) {
                apiResponse['code'] = 418;
                apiResponse['body'] = { error: "e" }
                reject(apiResponse);
            }
        });

        return promise;
    }

}
