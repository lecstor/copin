import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import _get from 'lodash/get';
import _set from 'lodash/set';
import _has from 'lodash/has';
import _isObject from 'lodash/isObject';
import _merge from 'lodash/merge';
import _forEach from 'lodash/forEach';

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

let GLOBAL_CONFIG;

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

export default function Copin ({ dir = 'config', noEnvMode = 'test', fresh = false } = {}) {
  if (GLOBAL_CONFIG && !fresh) {
    return GLOBAL_CONFIG;
  }
  const defaultConfig = loadConfig(`${dir}/default.yaml`);
  const modeConfig = loadConfig(`${dir}/${process.env.NODE_ENV}.yaml`);
  const mergedConfig = _merge({}, defaultConfig || {}, modeConfig || {});
  const envConfig = loadConfig(`${dir}/ENV_MAP.yaml`);
  if (process.env.NODE_ENV !== noEnvMode && envConfig) {
    _merge(mergedConfig, convertEnvConfig({ source: envConfig, location: '', result: {} }));
  }
  GLOBAL_CONFIG = Object.assign(Object.create(config), mergedConfig);
  return GLOBAL_CONFIG;
}
