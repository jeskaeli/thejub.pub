# thejub.pub
chat + shared video

## Setup
1. Clone this repo
2. Install node.js + npm
 * http://www.sitepoint.com/beginners-guide-node-package-manager/
 * Make sure the version of node you install meets the `"engines"` requirement in `package.json`.
3. Install the dependencies. From the project directory: `$ npm install --loglevel verbose`
4. Copy the test `config.js` under `test/` to the root level: `$ cp test/config.js config.js`

5. Get YouTube developer keys (you'll have to get one for server and one for browser) and replace `google_api_server_key` and `google_api_browser_key` with the ones provided by Google.

## Running the server
The server can be started with the following command:
```
$ TEST=1 npm start
```
Then visit `http://localhost:3000/ROUTE` in your browser, where `ROUTE` is the value of `"private_route"` in `config.js`. You can specify a different port number using the `PORT` environment variable.
