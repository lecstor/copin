import path from 'path';
import assert from 'assert';
import fs from 'fs';
import yaml from 'js-yaml';

import _get from 'lodash/get';
import _set from 'lodash/set';
import _has from 'lodash/has';
import _merge from 'lodash/merge';
import _forEach from 'lodash/forEach';
import _isObject from 'lodash/isObject';
import _includes from 'lodash/includes';

let GLOBAL_CONFIG;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * read and parse a YAML file
 * @param {String} relativePath - The path to a YAML file.
 * @returns {Object} data from the file
 */
export function loadConfig (relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  try {
    const stat = fs.statSync(fullPath);
    if (!stat || stat.size < 1) {
      return null;
    }
  } catch (e1) {
    return null;
  }

  let fileContent;
  try {
    fileContent = fs.readFileSync(fullPath, 'UTF-8');
    fileContent = fileContent.replace(/^\uFEFF/, '');
  } catch (err) {
    throw new Error(`Config file ${fullPath} cannot be read`);
  }
  return yaml.safeLoad(fileContent);
}

/**
 * create a config object by setting properties from env vars according to ENV_MAP
 * @param {Object} opts.source - The ENV_MAP or a subtree of the ENV_MAP.
 * @param {String} opts.location - The path to the current ENV_MAP subtree.
 * @param {Object} [opts.result] - An object representing the full config
 *     object tree to set values on.
 * @returns {Object} config to be merged into the main config object
 */
export function convertEnvConfig ({ source, location, result }) {
  if (_isObject(source)) {
    _forEach(source, (value, key) => {
      convertEnvConfig({ source: value, location: `${location}${location ? '.' : ''}${key}`, result });
    });
    return result;
  }
  if (process.env[source]) {
    _set(result, location, process.env[source]);
  }
  return result;
}

/**
 * If NODE_ENV config is not set, warn or error if option is set
 * @param {Object} nodeEnvConfig - The config read from NODE_ENV config file.
 * @param {String} noNodeEnvConfig - Whether to `warn`, `error`, or do nothing
 *     (`null`) if nodeEnvConfig is not set.
 */
function checkNodeEnvConfig (nodeEnvConfig, noNodeEnvConfig) {
  if (!nodeEnvConfig && noNodeEnvConfig) {
    const err = `config not found for NODE_ENV "${NODE_ENV}"`;
    if (noNodeEnvConfig === 'warn') {
      return console.log(`WARN: ${err}`);
    }
    // noNodeEnvConfig === 'error'
    throw new Error(err);
  }
}

const config = {
  get (path) {
    if (!this.has(path)) {
      throw new Error(`${path} is not defined in config`);
    }
    return _get(this, path);
  },
  has (path) {
    return _has(this, path);
  }
};

/**
 * returns a Copin instance
 * @param {String} opts.dir - A relative path to the config directory.
 *     Defaults to `config`.
 * @param {String} opts.fileOnlyNodeEnv - A NODE_ENV value for which
 *     environmental variables should not be merged into the config.
 *     Defaults to `test`.
 * @param {Boolean} opts.reload - If `true`, config will be reloaded.
 *     Defaults to `false`.
 * @param {String|null} opts.noNodeEnvConfig - What to do if there is no config
 *     for the current NODE_ENV. May be `null`, `'warn'`, or `'error'`.
 *     Defaults to `null`.
 * @param {Boolean} opts.isGlobal - if `true` then imports of the same
 *     installation of Copin will share the config object.
 *     Defaults to `true`.
 * @param {Object} opts.extConfig - if you have config from other sources you
 *     can include them here. They will override all config values except those
 *     from environmental variables mapped by ENV_MAP.
 */
export default function Copin ({
  dir = 'config',
  fileOnlyNodeEnv = 'test',
  reload = false,
  noNodeEnvConfig = null,
  isGlobal = true,
  extConfig = {}
} = {}) {
  if (isGlobal && GLOBAL_CONFIG && !reload) {
    return GLOBAL_CONFIG;
  }

  assert(
    !noNodeEnvConfig || _includes(['warn', 'error'], noNodeEnvConfig),
    `'noNodeEnvConfig' must be one of null (default), 'warn', or 'error', not ${noNodeEnvConfig}`
  );

  const defaultConfig = loadConfig(`${dir}/default.yaml`);

  const nodeEnvConfig = loadConfig(`${dir}/${NODE_ENV}.yaml`);
  checkNodeEnvConfig(nodeEnvConfig, noNodeEnvConfig);

  const mergedConfig = _merge({}, defaultConfig || {}, nodeEnvConfig || {}, extConfig);

  if (NODE_ENV !== fileOnlyNodeEnv) {
    const envConfig = loadConfig(`${dir}/ENV_MAP.yaml`);
    _merge(mergedConfig, convertEnvConfig({ source: envConfig, location: '', result: {} }));
  }

  const configInstance = Object.assign(Object.create(config), mergedConfig);
  if (isGlobal) {
    GLOBAL_CONFIG = configInstance;
  }
  return configInstance;
}
