# thejub.pub
chat + shared video

## Starting a local server
1. Clone this repo
2. Install node.js + npm:
 * https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories
 * http://www.sitepoint.com/beginners-guide-node-package-manager/
3. Install the dependencies. From the project directory:
```
$ npm install --loglevel verbose
```
Copy the test `config.js` under `test/` to the root level
```
$ cp test/config.js config.js
```
Get YouTube developer keys (you'll have to get one for server and one for browser) and replace `google_api_server_key` and
`google_api_browser_key` with the ones provided by Google.

The server can be started with the following command:
```
$ npm start
```
Then visit `http://localhost:3000/` in your browser. You can specify a different port number with:
```
$ PORT=1234 npm start
```
