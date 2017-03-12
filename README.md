Configure your Node.js Applications
===================================

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
* ENV_MAP.yaml can be used to set config values from shell environment variables. ENV_MAP is not used if NODE_ENV='test'.

**Install**

```shell
$ yarn add copin
// or
$ npm i -S copin
```

**Create a config directory in your app and add a default config file.**

The config directory is `config` by default, but this can be customised when
creating the Copin instance.

```shell
$ mkdir config
$ vi config/default.yaml
```
```yaml
server:
  host: localhost
  port: 8080
```

**Add `config/production.yaml`**

This will be merged into config when NODE_ENV=production

```yaml
server:
  host: myapp
  port: 80
```

**Add `config/ENV_MAP.yaml` if required**

This will map environment variables to config values.
This will not be used when NODE_ENV='test'.

```yaml
node:
  env: NODE_ENV
server:
  host: MY_APP_HOST
```

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
```
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

`Copin([{ dir, fresh, noEnvMode, noModeConfig, isGlobal }]);`

Get an instance of Copin. In normal use it's likely you will not need to specify
any options unless your config files are located somewhere other than the config
directory.

```
var config = Copin({ dir: 'copin/config/files' });
```

option  | type      | description
--------|-----------|------------
dir     | {String}  | relative path to the config directory. defaults to `config`
fresh   | {Boolean} | if true, config will be reloaded. defaults to false
noEnvMode | {String} | a NODE_ENV value for which environmental variables should not be merged into the config. defaults to `test`
noModeConfig | {String} | what to do if there is no config for the current mode (NODE_ENV). may be `null`, 'war', or 'error'. Defaults to null.
isGlobal | {Boolean} | if true then imports of the same installation of Copin will share the config object. Defaults to `true`

```
var host = config.get('server.host');
var host = config.server.host;
```
`get` will throw an exception for undefined keys to help catch typos and missing values.
You can access values directly if you prefer.

```
var hasHost = config.has('server.host');
```
Use `has` to test if a configuration value is defined. Returns `true`|`false`.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2017 Jason Galea
