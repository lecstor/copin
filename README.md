Config for Node.js Apps
=======================

Introduction
------------

Copin - opinionated config for node.. mostly..

Inspired by [node-config](https://github.com/lorenwest/node-config) with a lot
removed and a little added.

Copin is a fairly simple config loader. It will read and merge a default config
file, a config file matching the current NODE_ENV (development/production/etc),
and variables from the shell environment. Config files are [YAML](http://yaml.org/)
which is readable by humans and can contain comments.
[js-yaml](https://github.com/nodeca/js-yaml) is used to parse the config files.

Variables from the shell environment are not included in the config when NODE_ENV
is 'test' as tests should not use ENV and should have full control over the loaded
config.

**Config loading**

* config from default.yaml is always loaded.
* If a config file exists that has the same name as the value of NODE_ENV then
that config is loaded and merged with the default config. eg NODE_ENV=production,
production.yaml will be loaded.
* unless NODE_ENV == 'test'
  * ENV_MAP.yaml will be used to set config values from shell environment variables.
  * local.yaml will override all other config values

Installation
------------

```bash
$ yarn add copin
// or
$ npm i -S copin
```

Setup
-----

**Create config files in your app**

The config directory is `config` by default, but this can be customised when
creating the Copin instance.

```
my-app
├── config/
│   ├── default.yaml
│   ├── ENV_MAP.yaml
│   ├── local.yaml
│   ├── production.yaml
│   └── test.yaml
├── src/
├── .gitignore
└── README.md
```

.gitignore:
```
config/local.yaml
```

config/default.yaml:
```yaml
server:
  host: localhost
  port: 8080
  log_level: info
```

config/production.yaml:
```yaml
server:
  host: myapp
  port: 80
```

config/test.yaml:
```yaml
server:
  log_level: fatal
```

config/ENV_MAP.yaml:
```yaml
server:
  host: MY_APP_HOST
```

Scenario Examples
-----------------

**bare start**

`npm start`

- internal NODE_ENV defaults to 'development'.
- default.yaml is loaded and used as config.
- ENV_MAP is checked but does not affect config as MY_APP_HOST is not set in the environment.

```yaml
server:
  host: localhost
  port: 8080
  log_level: info
```

**start with environment variable**

```bash
MY_APP_HOST=app-host npm start
```

- internal NODE_ENV defaults to 'development'.
- default.yaml is loaded and used as config.
- ENV_MAP overrides server.host to `app-host`.

```yaml
server:
  host: app-host
  port: 8080
  log_level: info
```

**start in production with environment variable**

```bash
MY_APP_HOST=app-host NODE_ENV=production npm start`
```
- default.yaml is loaded and used as config.
- production.yaml is loaded and merged into the config.
- ENV_MAP overrides server.host to `app-host`.

```yaml
server:
  host: app-host
  port: 80
  log_level: info
```

**start in test with environment variable**

```bash
MY_APP_HOST=app-host NODE_ENV=test npm start`
```
- default.yaml is loaded and used as config.
- test.yaml is loaded and merged into the config.
- ENV_MAP is not loaded (in test mode).

```yaml
server:
  host: localhost
  port: 8080
  log_level: fatal
```

**add a local config**

config/local.yaml:
```yaml
server:
  port: 8765
```

- local.yaml overrides the port

```yaml
server:
  host: localhost
  port: 8765
  log_level: info
```

Usage
-----

**Import/Require Copin**

In ES6:
```js
var Copin = require('copin').default;
```

In ES6:
```js
import Copin from 'copin';
```

**Usage**
```js
var config = Copin();

var serverHost = config.get('server.host');
// or
var serverHost = config.server.host;

server.start(serverHost);

if (config.has('node.env')) {
  var env = config.get('node.env');
  //...
}
```

API
---

```js
Copin([{ dir, reload, fileOnlyNodeEnv, noNodeEnvConfig, isGlobal }]);
```

Get an instance of Copin. In normal use it's likely you will not need to specify
any options unless your config files are located somewhere other than the config
directory.

```js
var config = Copin({ dir: 'copin/config/files' });
```

option               | type    | description
---------------------|---------|------------
dir                  | String  | relative path to the config directory. defaults to `config`
reload               | Boolean | if `true`, config will be reloaded. defaults to `false`
includeEnvMapInTest  | Boolean | if `true`, env map values will be included in test mode. defaults to `false`
includeLocalInTest   | Boolean | if `true`, local.yaml values will be included in test mode. defaults to `false`
alertNoNodeEnvConfig | String  | what to do if there is no config for the current NODE_ENV. May be `null`, `'warn'`, or `'error'`. Defaults to `null`.
isGlobal             | Boolean | if `true` then imports of the same installation of Copin will share the config object. Defaults to `true`
extConfig            | Object  | if you have config from other sources you can include them here. They will override all config values except those from environmental variables mapped by ENV_MAP.

```js
var host = config.get('server.host');
var host = config.server.host;
```
`get` will throw an exception for undefined keys to help catch typos and missing values.
You can access values directly if you prefer.

```js
var hasHost = config.has('server.host');
```
Use `has` to test if a configuration value is defined. Returns `true`|`false`.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lecstor/copin/master/LICENSE).

Copyright (c) 2017 Jason Galea
