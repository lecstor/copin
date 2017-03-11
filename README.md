Configure your Node.js Applications
===================================

Introduction
------------

Copin - opinionated config for node.. mostly..

Based loosely on [node-config](https://github.com/lorenwest/node-config)

Copin is a fairly simple config loader. It will read and merge a default config
file, a config file matching the current NODE_ENV (development/production/etc),
and variables from the shell environment.

**Config loading**

* config from default.yaml is always loaded.
* If a config file exists that has the same name as the value of NODE_ENV then
that config is loaded and merged with the default config. eg NODE_ENV=production,
production.yaml will be loaded.
* ENV_MAP.yaml can be used to set config values from shell environment variables. ENV_MAP is not used if NODE_ENV='test'.

Quick Start
-----------

**Install**

```shell
$ yarn add copin
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

**Add `config/production.yaml` to be merged into config when NODE_ENV=production:**

```yaml
server:
  host: myapp
  port: 80
```

**Add `config/ENV_MAP.yaml` to map config values to environment variables:**

`ENV_MAP.yaml` will not be used when NODE_ENV='test'.

```shell
 $ vi config/ENV_MAP.yaml
```

```yaml
node:
  env: NODE_ENV
```

**Use config in your code:**

```js
import Copin from 'copin';
const config = Copin();
const config = Copin({ dir: 'other-config', fresh: true });
//...
const serverHost = config.get('server.host');
// or
const serverHost = config.server.host;

server.start(serverHost);

if (config.has('node.env')) {
  const env = config.get('node.env');
  //...
}
```

**Start your app server:**

```shell
$ NODE_ENV=production node my-app.js
```

Running in this configuration, the `port` element of `server` will come from
the `default.yaml` file, the `host` element will come from the `production.yaml`
override file, and `node.env` will come from the shell environment variable.

API
---

`const config = Copin();`

Get an instance of Copin with default settings. Copin is a singleton so files and env will only be loaded once. Config files will be read from `./config`.

`const config = Copin({ dir: 'config' });`

Set the directory where config files will be found.

`const config = Copin({ fresh: false });`

If `fresh` is true the Copin singleton will be reloaded. If config files or
environment variables have changed and the Copin instance needs to be updated then call `config = Copin({ fresh: true })`. (used in Copin tests)

`const config = Copin({ noEnvMode: 'test' });`

By default ENV_MAP will not be used when NODE_ENV='test'. You can set this to
a different mode, or none at all, if you have the need. (also used in Copin
tests)

`const host = config.get('server.host');`

`get` will throw an exception for undefined keys to help catch typos and missing values.

`const hasHost = config.has('server.host');`

Use `has` to test if a configuration value is defined. Returns true|false.

`const host = config.server.host;`

If you prefer you can access config values directly as js object properties.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2017 Jason Galea
