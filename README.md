Configure your Node.js Applications
===================================

Introduction
------------

Copin - opinionated config for node.. mostly..

Based loosely on [node-config](https://github.com/lorenwest/node-config)

It lets you define a set of default parameters and extend them for different
deployment environments (development, qa, staging, production, etc.).

Config is always loaded from default.yaml.
If a config file exists that has the same name as the value of NODE_ENV then
that config is loaded and merged with the default config.
eg when NODE_ENV=production, production.yaml will be loaded.

ENV_MAP.yaml may also be added and will set mapped config values to the value
of current shell environment variables. ENV_MAP is not used if NODE_ENV='test'.

Quick Start
---------------

**Install**

```shell
$ npm install copin
```

**Create a config directory in your app directory and add a default config file.**

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
var Copin = require('copin');
var config = Copin();
//...
var serverHost = config.get('server.host');
// or
var serverHost = config.server.host;

server.start(serverHost);

if (config.has('node.env')) {
  var env = config.get('node.env');
  //...
}
```

`config.get()` will throw an exception for undefined keys to help catch typos and missing values.
Use `config.has()` to test if a configuration value is defined.

**Start your app server:**

```shell
$ NODE_ENV=production node my-app.js
```

Running in this configuration, the `port` element of `server` will come from
the `default.yaml` file, the `host` element will come from the `production.yaml`
override file, and `node.env` will come from the shell environment variable.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2017 Jason Galea
