Config for Node.js Apps
=======================

Introduction
------------

Copin - opinionated config for node..


Copin is a fairly simple config loader. It will read and merge: 
* a default config file
* a config file matching the current NODE_ENV (development/production/test)
* a config file matching the current COPIN_CONFIG (dev-build/woteva-custom)
  * can also be a comma separated list to load multiple config files, eg `dev-build, woteva-custom`
* variables from the shell environment.

By default variables from the shell environment are not included in the config
when NODE_ENV is 'test'.

**Config loading**

By default:
* config/default.ts is always loaded.
* config/{NODE_ENV}.{ts|js} is merged if it exists.
  * eg if NODE_ENV=production, production.ts will be loaded.
* when NODE_ENV === "development" | "production"
  * ENV_MAP.ts will be used to set config values from shell environment variables.
  * local.ts will override all other config values

Installation
------------

```bash
$ yarn add copin lodash
// or
$ npm i -S copin lodash
```

Setup
-----

**Create config files in your app**

The config directory is `config` by default, but this can be customised when
creating the Copin instance with the `dir` option.

```
my-app
├── config/
│   ├── default.ts
│   ├── ENV_MAP.ts
│   ├── local.ts
│   ├── production.ts
│   ├── test.ts
│   └── types.ts
├── src/
├── .gitignore
└── README.md
```

.gitignore:
```
config/local.ts
```

config/default.ts:
```ts
import { Config } from "../types";

const config: Partial<Config> = {
  server: {
    host: "localhost",
    port: "8080",
    log_level: "info"
  }
};

export { config }
```

config/production.ts:
```ts
import { RecursivePartial } from "copin";
import { Config } from "../types";

const config: RecursivePartial<Config> = {
  server: {
    host: "myapp",
    port: "80",
  }
};

export { config }
```

config/test.ts:
```ts
import { RecursivePartial } from "copin";
import { Config } from "../types";

const config: RecursivePartial<Config> = {
  server: {
    log_level: "fatal"
  }
};

export { config }
```

config/ENV_MAP.ts:
```ts
import { RecursivePartial } from "copin";
import { Config } from "../types";

const config: RecursivePartial<Config> = {
  server: {
    host: "MY_APP_HOST",
  }
};

export { config }
```

Scenario Examples
-----------------
using the config files from above..

**bare start**

`npm start`

- internal NODE_ENV defaults to 'development'.
- default.ts is loaded and used as config.
- ENV_MAP is checked but does not affect config as MY_APP_HOST is not set in the environment.

```json
{
  server: {
    host: "localhost",
    port: "8080",
    log_level: "info"
  }
}
```

**start with environment variable**

```bash
MY_APP_HOST=app-host npm start
```

- internal NODE_ENV defaults to 'development'.
- default.ts is loaded and used as config.
- ENV_MAP overrides server.host to `app-host`.

```json
{
  server: {
    host: "app-host",
    port: "8080",
    log_level: "info"
  }
}
```

**start in production with environment variable**

```bash
MY_APP_HOST=app-host NODE_ENV=production npm start`
```
- default.ts is loaded and used as config.
- production.ts is loaded and merged into the config.
- ENV_MAP overrides server.host to `app-host`.

```json
{
  server: {
    host: "app-host",
    port: "80",
    log_level: "info"
  }
}
```

**start in test with environment variable**

```bash
MY_APP_HOST=app-host NODE_ENV=test npm start`
```
- default.ts is loaded and used as config.
- test.ts is loaded and merged into the config.
- ENV_MAP is not loaded (in test mode).

```json
{
  server: {
    host: "localhost",
    port: "8080",
    log_level: "fatal"
  }
}
```

**add a local config**

config/local.ts:
```ts
import { Config } from "../types";

const config: Partial<Config> = {
  server: {
    port: "8765",
  }
};

export { config }
```

- local.ts overrides the port

```json
{
  server: {
    host: "localhost",
    port: "8765",
    log_level: "info"
  }
}
```

Usage
-----

**Import Copin**

```ts
import copin from 'copin';
```

**Usage**
```ts
const config = copin();

const serverHost = config.server.host;

server.start(serverHost);
```

API
---

```ts
copin();
copin({ dir, reload, fileOnlyNodeEnv, noNodeEnvConfig, isGlobal });
```

Get an instance of Copin. In normal use it's likely you will not need to specify
any options unless your config files are located somewhere other than the config
directory.

```ts
var config = copin({ dir: 'copin/config/files' });
```

option               | type    | description
---------------------|---------|------------
dir                  | String  | relative path to the config directory. defaults to `config`
reload               | Boolean | if `true`, config will be reloaded. defaults to `false`
includeEnvMapInTest  | Boolean | if `true`, env map values will be included in test mode. defaults to `false`
includeLocalInTest   | Boolean | if `true`, local.ts values will be included in test mode. defaults to `false`
alertNoNodeEnvConfig | String  | what to do if there is no config for the current NODE_ENV. May be `null`, `'warn'`, or `'error'`. Defaults to `null`.
isGlobal             | Boolean | if `true` then imports of the same installation of Copin will share the config object. Defaults to `true`
extConfig            | Object  | if you have config from other sources you can include them here. They will override all config values except those from environmental variables mapped by ENV_MAP.

License
-------

May be freely distributed under the [MIT license](https://raw.githubusercontent.com/lecstor/copin/master/LICENSE).

Copyright (c) 2017 Jason Galea
