import Copin from '../';

describe('load config', () => {
  it('loads the default config', () => {
    const config = Copin({ fresh: true });
    expect(config).toBeDefined();
    expect(config.test).toBe('hurrah!');
  });

  it('returns the cached config config', () => {
    const config = Copin({ dir: './src/__tests__/config', fresh: true });
    const config2 = Copin({ dir: './src/__tests__/config' });
    expect(config).toBe(config2);
  });

  it('loads mode config over default config', () => {
    const config = Copin({ dir: './src/__tests__/config', fresh: true });
    expect(config.fromDefault).toBe('Hello World!');
    expect(config.fromTest).toBe('set by test.yaml');
  });

  it('loads ENV vars according to ENV_MAP', () => {
    const config = Copin({ dir: './src/__tests__/config', noEnvMode: 'null', fresh: true });
    expect(config.node.env).toBe('test');
  });

  it('loads ENV vars over mode config', () => {
    const config = Copin({ dir: './src/__tests__/config', noEnvMode: 'null', fresh: true });
    expect(config.fromEnv).toBe('test');
  });
});

describe('accessors', () => {
  const config = Copin({ dir: './src/__tests__/config', fresh: true });

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
