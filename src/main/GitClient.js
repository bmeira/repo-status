import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import { getModuleImport } from '../../utils.js';

const { Logger } = await import(getModuleImport('src/util/Logger.js'));
const { ClientOperation } = await import(getModuleImport('src/main/ClientOperation.js'));

const logger = new Logger('GitClient');

export class GitClient {
    #url;
    #authToken;
    #httpSession;
    #operations;

    constructor(url, authToken, timeout) {
        this.#url = url;
        this.#authToken = authToken;
        this.#operations = new Map([
            [ClientOperation.PullRequestCount, {
                path: 'api/v3/notifications',
                action: 'GET',
                field: ''
            }]
        ]);

        this.#httpSession = new Soup.Session();
        this.#httpSession.timeout = timeout;
        this.#httpSession.user_agent = 'gnome-shell-extension';
    }

    async getOperationPromise(operation) {

        if (!this.#operations.has(operation)) {
            let rObj = { errCode: 'ns', errDesc: 'Operation not supported' };
            return this.#buildResponse(operation, 404, rObj);
        }

        if (!this.#url || this.#url.trim() === '') {
            let rObj = { errCode: 'nf', errDesc: 'Server URL is not configured. Open Settings to set it.' };
            return this.#buildResponse(operation, 404, rObj);
        }

        const clientProperties = this.#operations.get(operation);
        const baseUrl = this.#url.endsWith('/') ? this.#url : `${this.#url}/`;
        const fullUri = `${baseUrl}${clientProperties.path}`;

        let uri;
        try {
            uri = GLib.Uri.parse(fullUri, GLib.UriFlags.NONE);
        } catch (error) {
            let rObj = { errCode: 'nf', errDesc: 'invalid URL: ' + fullUri };
            return this.#buildResponse(operation, 404, rObj);
        }

        const message = Soup.Message.new_from_uri(clientProperties.action, uri);
        message.request_headers.append('Authorization', this.#authToken);
        message.request_headers.set_content_type('application/json', null);

        try {
            const bytes = await this.#httpSession.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null
            );

            if (!bytes || bytes.get_size() === 0) {
                let rObj = { errCode: 'nr', errDesc: 'Empty response' };
                return this.#buildResponse(operation, 404, rObj);
            }

            const responseData = new TextDecoder().decode(bytes.get_data());
            return this.#buildResponse(operation, message.status_code, JSON.parse(responseData));

        } catch (error) {
            let rObj = { errCode: 'ge', error: error };
            return this.#buildResponse(operation, 500, rObj);
        }
    }


    #buildResponse(operation, statusCode, gitResponse, error = null) {
        if (error) {
            logger.error(error);
            return { code: 418, body: { error: "g" } };
        }

        const response = { code: statusCode };
        const responseBody = {};

        if (statusCode >= 300) {
            logger.error(operation.description + " | " + statusCode + " | " + JSON.stringify(gitResponse));
            responseBody['error'] = gitResponse['errCode'];
            responseBody['errDesc'] = gitResponse['errDesc'] || '';
        }
        else if (statusCode == 200) {

            const filtered = gitResponse
                .filter(x => x.reason == "review_requested")
                .filter(x => x.subject.type == "PullRequest")
                .filter(x => !x.subject.title.startsWith("Bump "))
                .filter(x => x.unread === true);
            responseBody[operation.response] = filtered.length;
            responseBody[operation.titles] = filtered.map(x => x.subject.title);
            responseBody[operation.links] = filtered.map(x => {
                // Convert API URL to browser URL
                // e.g. https://atc-github.azure.cloud.bmw/api/v3/repos/OWNER/REPO/pulls/123
                //   -> https://atc-github.azure.cloud.bmw/OWNER/REPO/pull/123
                try {
                    const apiUrl = x.subject.url;
                    const match = apiUrl.match(/\/api\/v3\/repos\/(.+?)\/(.+?)\/pulls\/(\d+)/);
                    if (match) {
                        const baseUrl = apiUrl.split('/api/v3/')[0];
                        return `${baseUrl}/${match[1]}/${match[2]}/pull/${match[3]}`;
                    }
                    return x.repository.html_url || apiUrl;
                } catch (_e) {
                    return x.subject.url;
                }
            });

        }
        response.body = responseBody;

        logger.info(JSON.stringify(response));
        return response;
    }
}