import * as fs from 'fs';

import Copin from '../';

const defaultOpts = { dir: './src/__tests__/config', reload: true, isGlobal: false, fileOnlyNodeEnv: null };

describe('load config', () => {
  it('loads the default config', () => {
    const config = Copin();
    expect(config).toBeDefined();
    expect(config.test).toBe('hurrah!');
    expect(config.fromEnv).toBeUndefined();
    console.log({ config });
  });

  it('loads the default config (reload: true)', () => {
    const config = Copin({ reload: true, fileOnlyNodeEnv: null });
    expect(config).toBeDefined();
    expect(config.test).toBe('hurrah!');
    expect(config.fromEnv).toBe('test');
  });

  it('loads the default config (isGlobal: false)', () => {
    const config = Copin({ isGlobal: false, fileOnlyNodeEnv: null });
    expect(config).toBeDefined();
    expect(config.test).toBe('hurrah!');
    expect(config.fromEnv).toBe('test');
  });

  it('loads config even when default does not exist', () => {
    const config = Copin({ ...defaultOpts, dir: './src/__tests__/config-no-default' });
    expect(config).toBeDefined();
    expect(config.fromTest).toBe('set by test.yaml');
    expect(config.fromEnv).toBe('test');
  });

  it('uses cached config', () => {
    const config = Copin({ ...defaultOpts, isGlobal: true });
    const config2 = Copin({ ...defaultOpts, isGlobal: true, reload: false });
    expect(config).toBe(config2);
  });

  it('NODE_ENV config overrides default config', () => {
    const config = Copin(defaultOpts);
    expect(config.fromDefault).toBe('Hello World!');
    expect(config.fromTest).toBe('set by test.yaml');
  });

  it('external config overrides NODE_ENV config', () => {
    const config = Copin({ ...defaultOpts, extConfig: { fromExt: 'set by external config' } });
    expect(config.fromExt).toBe('set by external config');
  });

  it('throws an error on invalid noNodeEnvConfig option', () => {
    expect(() => Copin({ ...defaultOpts, noNodeEnvConfig: 'WRONG' })).toThrow();
  });

  it('throws an error on unreadable config file', () => {
    fs.chmodSync('./src/__tests__/config-unreadable/default.yaml', 0o244);
    expect(() => Copin({ ...defaultOpts, dir: './src/__tests__/config-unreadable' })).toThrow();
    fs.chmodSync('./src/__tests__/config-unreadable/default.yaml', 0o644);
  });

  describe('missing mode config', () => {
    it('ignores missing mode config', () => {
      const config = Copin({ ...defaultOpts, dir: './src/__tests__/config-no-mode' });
      expect(config.fromDefault).toBe('Hello World!');
      expect(config.fromTest).toBe('set by default.yaml');
    });

    it('warns on missing mode config', () => {
      let log = [];
      const origLog = console.log;
      console.log = (msg) => {
        log.push(msg);
      };
      const config = Copin({ ...defaultOpts, dir: './src/__tests__/config-no-mode', noNodeEnvConfig: 'warn' });
      console.log = origLog;
      expect(log[0]).toEqual('WARN: config not found for NODE_ENV "test"');
      expect(config.fromDefault).toBe('Hello World!');
      expect(config.fromTest).toBe('set by default.yaml');
    });

    it('throws an error on missing mode config', () => {
      expect(() => Copin({ ...defaultOpts, dir: './src/__tests__/config-no-mode', noNodeEnvConfig: 'error' })).toThrow();
    });
  });

  describe('empty mode config', () => {
    it('ignores empty mode config', () => {
      const config = Copin({ ...defaultOpts, dir: './src/__tests__/config-empty-mode' });
      expect(config.fromDefault).toBe('Hello World!');
      expect(config.fromTest).toBe('set by default.yaml');
    });

    it('warns on empty mode config', () => {
      let log = [];
      const origLog = console.log;
      console.log = (msg) => {
        log.push(msg);
      };
      const config = Copin({ ...defaultOpts, dir: './src/__tests__/config-empty-mode', noNodeEnvConfig: 'warn' });
      console.log = origLog;
      expect(log[0]).toEqual('WARN: config not found for NODE_ENV "test"');
      expect(config.fromDefault).toBe('Hello World!');
      expect(config.fromTest).toBe('set by default.yaml');
    });

    it('errors on empty mode config', () => {
      expect(() => Copin({ ...defaultOpts, dir: './src/__tests__/config-empty-mode', noNodeEnvConfig: 'error' })).toThrow();
    });
  });

  describe('ENV_MAP', () => {
    it('loads ENV vars according to ENV_MAP', () => {
      const config = Copin({ ...defaultOpts, fileOnlyNodeEnv: null });
      expect(config.node.env).toBe('test');
    });

    it('ENV vars override mode and default config', () => {
      const config = Copin({ ...defaultOpts, fileOnlyNodeEnv: null });
      expect(config.fromEnv).toBe('test');
    });
  });
});

describe('accessors', () => {
  const config = Copin(defaultOpts);

  it('allows direct access', () => {
    expect(config.fromDefault).toBe('Hello World!');
    expect(config.it.is.deep).toBe('deeep');
  });

  it(`privides a 'get' method`, () => {
    expect(config.get('fromDefault')).toBe('Hello World!');
    expect(config.get('it.is.deep')).toBe('deeep');
  });

  it(`privides a 'get' method that throws on unset config path`, () => {
    expect(() => {
      config.get('not.set');
    }).toThrow();
  });

  it(`privides a 'has' method`, () => {
    expect(config.has('fromDefault')).toBe(true);
    expect(config.has('it.is.deep')).toBe(true);
    expect(config.has('not.set')).toBe(false);
  });
});
