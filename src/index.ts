import path from "path";

import _set from "lodash/set";
import _merge from "lodash/merge";

let GLOBAL_CONFIG: unknown;

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

function isObject(variable: unknown) {
  return Object.prototype.toString.call(variable) === "[object Object]";
}

/**
 * import config file
 * @param {String} relativePath - The path to a YAML file.
 * @returns {Object} data from the file
 */
export function loadConfig<Config>(relativePath: string) {
  const fullPath = /^\//.test(relativePath)
    ? relativePath
    : path.join(process.cwd(), relativePath);
  let data: { config: Config };
  try {
    data = require(fullPath);
  } catch (error) {
    if (!/^Cannot find module/.test(error.message)) {
      throw error;
    }
    return null;
  }
  // return "default" in config ? config.default : config;
  return data.config;
}

/**
 * create a config object by setting properties from env vars according to ENV_MAP
 * @param {Object} opts.source - The ENV_MAP or a subtree of the ENV_MAP.
 * @param {String} opts.location - The path to the current ENV_MAP subtree.
 * @param {Object} [opts.result] - An object representing the full config
 *     object tree to set values on.
 * @returns {Object} config to be merged into the main config object
 */
function convertEnvConfig<Config>({
  source,
  location,
  result
}: {
  source: any;
  location: string;
  result: Config;
}) {
  if (isObject(source)) {
    for (const key in source) {
      convertEnvConfig<Config>({
        source: source[key],
        location: `${location}${location ? "." : ""}${key}`,
        result
      });
    }
    return result;
  }
  if (process.env[source as string]) {
    _set(
      (result as unknown) as object,
      location,
      process.env[source as string]
    );
  }
  return result;
}

/**
 * If NODE_ENV config is not set, warn or error if option is set
 * @param {Object} nodeEnvConfig - The config read from NODE_ENV config file.
 * @param {String} alertNoNodeEnvConfig - Whether to `warn`, `error`, or do nothing
 *     (`null`) if nodeEnvConfig is not set.
 */
function checkAlertNoNodeEnvConfig<Config>(
  nodeEnvConfig: RecursivePartial<Config>,
  alertNoNodeEnvConfig: string | null,
  path: string
) {
  // console.log({ nodeEnvConfig, alertNoNodeEnvConfig});
  if (
    (!nodeEnvConfig || !Object.keys(nodeEnvConfig).length) &&
    alertNoNodeEnvConfig
  ) {
    const err = `config not found for NODE_ENV at ${path}`;
    if (alertNoNodeEnvConfig === "warn") {
      return console.log(`WARN: ${err}`);
    }
    // alertNoNodeEnvConfig === 'error'
    throw new Error(err);
  }
}

export type CopinOptions = {
  dir?: string;
  includeEnvMapInTest?: boolean;
  includeLocalInTest?: boolean;
  includeLocalInProduction?: boolean;
  logLoaded?: boolean;
  reload?: boolean;
  alertNoNodeEnvConfig?: "warn" | "error" | null;
  isGlobal?: boolean;
  extConfig?: unknown;
};

/**
 * returns a Copin instance
 * @param {String} opts.dir - A relative path to the config directory.
 *     Defaults to `config`.
 * @param {Boolean} opts.includeEnvMapInTest - if `true`, env map values will be
 *     included in test mode. Defaults to `false`.
 * @param {Boolean} opts.includeLocalInTest - if `true`, local.ts values will
 *     be included in test mode. Defaults to `false`.
 * @param {Boolean} opts.reload - If `true`, config will be reloaded.
 *     Defaults to `false`.
 * @param {String|null} opts.alertNoNodeEnvConfig - What to do if there is no config
 *     for the current NODE_ENV. May be `null`, `'warn'`, or `'error'`.
 *     Defaults to `null`.
 * @param {Boolean} opts.isGlobal - if `true` then imports of the same
 *     installation of Copin will share the config object.
 *     Defaults to `true`.
 * @param {Object} opts.extConfig - if you have config from other sources you
 *     can include them here. They will override all config values except those
 *     from environmental variables mapped by ENV_MAP.
 */
export default function copin<Config = object>(
  options?: CopinOptions & { extConfig?: RecursivePartial<Config> }
): Config {
  const {
    dir = "./config",
    includeEnvMapInTest = false,
    includeLocalInTest = false,
    includeLocalInProduction = false,
    logLoaded = true,
    reload = false,
    alertNoNodeEnvConfig = null,
    isGlobal = true,
    extConfig
  } = options || {};
  if (isGlobal && GLOBAL_CONFIG && !reload) {
    return GLOBAL_CONFIG as Config;
  }

  type PConfig = RecursivePartial<Config>;

  const { NODE_ENV = "development", COPIN_CONFIG } = process.env;

  const loaded: string[] = [];

  const config = JSON.parse(
    JSON.stringify(loadConfig<PConfig>(`${dir}/default`) || {})
  );
  config && loaded.push("default");

  const nodeEnvConfig = loadConfig<PConfig>(`${dir}/${NODE_ENV}`);
  checkAlertNoNodeEnvConfig<Config>(
    nodeEnvConfig,
    alertNoNodeEnvConfig,
    `${dir}/${NODE_ENV}`
  );
  if (nodeEnvConfig) {
    _merge(config, nodeEnvConfig);
    loaded.push(NODE_ENV);
  }

  if (COPIN_CONFIG) {
    const configNames = COPIN_CONFIG.split(/\s*,\s*/);
    configNames.map(name => {
      const copinConfig = loadConfig<PConfig>(`${dir}/${name}`);
      if (copinConfig) {
        _merge(config, copinConfig);
        loaded.push(name);
      }
    });
  }

  if (extConfig) {
    _merge(config, extConfig);
    loaded.push("extConfig");
  }

  if (NODE_ENV !== "test" || includeEnvMapInTest) {
    const envConfig = loadConfig<PConfig>(`${dir}/ENV_MAP`);
    if (envConfig) {
      _merge(
        config,
        convertEnvConfig<PConfig>({
          source: envConfig,
          location: "",
          result: {}
        })
      );
      loaded.push("ENV_MAP");
    }
  }

  const loadLocal =
    NODE_ENV === "development" ||
    (NODE_ENV === "test" && includeLocalInTest) ||
    (NODE_ENV === "production" && includeLocalInProduction);

  if (loadLocal) {
    const localConfig = loadConfig<PConfig>(`${dir}/local.ts`);
    if (localConfig) {
      _merge(config, localConfig);
      loaded.push("local");
    }
  }

  if (logLoaded) {
    const last = loaded.length > 1 ? loaded.pop() : "";
    console.log(
      `Copin config loaded ${loaded.join(", ")}${loaded.length > 1 ? "," : ""}${
        last ? ` and ${last}` : ""
      } from ${dir}`
    );
  }

  if (isGlobal) {
    GLOBAL_CONFIG = config;
  }
  return config;
}
