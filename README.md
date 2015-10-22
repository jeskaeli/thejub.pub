# jub.dj
chat + shared video

## Starting a local server
1. Clone this repo
2. Install node.js + npm:
 * https://nodesource.com/blog/nodejs-v012-iojs-and-the-nodesource-linux-repositories
 * http://www.sitepoint.com/beginners-guide-node-package-manager/
3. Install the dependencies:
```
$ cd jub.dj
$ npm install --loglevel verbose
````
4. The server can be started with the following command (though it won't work well without a file called config.js, which is not under source control).
```
$ npm start
```
Then visit `http://localhost:3000/` in your browser. You can specify a different port number with:
```
$ PORT=1234 npm start
```

## Testing
TODO
