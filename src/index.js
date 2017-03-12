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
const NODE_ENV = process.env.NODE_ENV;

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

export function convertEnvConfig ({ source, location, result }) {
  if (_isObject(source)) {
    _forEach(source, (value, key) => {
      convertEnvConfig({ source: value, location: `${location}${location ? '.' : ''}${key}`, result });
    });
    return result;
  }
  _set(result, location, process.env[source]);
  return result;
}

function checkModeConfig (modeConfig, noModeConfig) {
  if (!modeConfig && noModeConfig) {
    const err = `config not found for NODE_ENV "${NODE_ENV}"`;
    if (noModeConfig === 'warn') {
      return console.log(`WARN: ${err}`);
    }
    // noModeConfig === 'error'
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

export default function Copin ({
  dir = 'config',
  noEnvMode = 'test',
  fresh = false,
  noModeConfig = null,
  isGlobal = true
} = {}) {
  if (isGlobal && GLOBAL_CONFIG && !fresh) {
    return GLOBAL_CONFIG;
  }

  assert(
    !noModeConfig || _includes(['warn', 'error'], noModeConfig),
    `'noModeConfig' must be one of null (default), 'warn', or 'error', not ${noModeConfig}`
  );

  const defaultConfig = loadConfig(`${dir}/default.yaml`);

  const modeConfig = loadConfig(`${dir}/${NODE_ENV}.yaml`);
  checkModeConfig(modeConfig, noModeConfig);

  const mergedConfig = _merge({}, defaultConfig || {}, modeConfig || {});

  if (NODE_ENV !== noEnvMode) {
    const envConfig = loadConfig(`${dir}/ENV_MAP.yaml`);
    _merge(mergedConfig, convertEnvConfig({ source: envConfig, location: '', result: {} }));
  }

  const configInstance = Object.assign(Object.create(config), mergedConfig);
  if (isGlobal) {
    GLOBAL_CONFIG = configInstance;
  }
  return configInstance;
}
