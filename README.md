Configure your Node.js Applications
===================================

Introduction
------------

Copin - opinionated config for node.. mostly..

Based loosely on [node-config](https://github.com/lorenwest/node-config)

It lets you define a set of default parameters and extend them for different
deployment environments (development, qa, staging, production, etc.).

Configurations are stored in YAML configuration files within your application,
and can be overridden and extended by environment variables.

Quick Start
---------------

**Install in your app directory, and edit the default config file.**

```shell
$ npm install copin
$ mkdir config
$ vi config/default.yaml
```
```yaml
server:
  host: localhost
  port: 8080
```

**Edit config overrides for production deployment:**

```shell
 $ vi config/production.yaml
```

```yaml
server:
  host: myapp
  port: 80
```

**Edit config ENV var overrides:**

ENV var overrides will not be set when NODE_ENV is 'test'

```shell
 $ vi config/ENV_MAP.yaml
```

```yaml
node:
  env: NODE_ENV
```

**Use configs in your code:**

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
override file, and `node.env` will come from the shell environment variables.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lorenwest/node-config/master/LICENSE).

Copyright (c) 2017 Jason Galea
