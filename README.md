# periodicjs.ext.login

An authentication extension that uses passport to authenticate user sessions.

 [API Documentation](https://github.com/typesettin/periodicjs.ext.login/blob/master/doc/api.md)

## Installation

```
$ npm install periodicjs.ext.login
```

## Configure

you can define your own passort authentication strategies, after the extension has been installed, the extension configuration is located in `content/config/extensions/periodicjs.ext.login/transport.json`

##Development
*Make sure you have grunt installed*
```
$ npm install -g grunt-cli
```

Then run grunt watch
```
$ grunt watch
```
For generating documentation
```
$ grunt doc
$ jsdoc2md controller/**/*.js index.js install.js uninstall.js > doc/api.md
```
##Notes
* Check out https://github.com/typesettin/periodicjs for the full Periodic Documentation