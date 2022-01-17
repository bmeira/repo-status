"use strict";

const Lang = imports.lang;
const Soup = imports.gi.Soup;


/*
 * Methods and properties starting with _ should ideally be private. 
 * Gnome, however, doesn't currently support private methods/variables
 */
class BitbucketApiWrapper {

    _url;
    _authToken;
    _httpSession;


    constructor(url, authToken, timeout) {
        this._httpSession = new Soup.SessionAsync();
        this._httpSession['timeout'] = timeout;
        
        this._url = url;
        this._authToken = authToken;
    }


    doApiCall(endpoint, callback) {
        let request = Soup.Message.new('GET', this._url + endpoint);
        let response = {};
        
        request.request_headers.append('Authorization', this._authToken)
        request.request_headers.set_content_type("application/json", null);

        try {
            this._httpSession.queue_message(request, Lang.bind(this,
                function (_httpSession, message) {
                    response['code'] = message.status_code;
                    response['body'] = message.status_code === 200 ? JSON.parse(request['response_body'].data) : { error: "f" };
                    callback(response);
                })
            );
        }
        catch (err) {
            response['code'] = 418;
            response['body'] = { error: "e" }
            callback(response, err);
        }
    }

}