import fs from "fs";
import copin from "../dist";
import { Config } from "../test/fixtures/types";

const defaultOpts = {
  dir: "./test/fixtures/config",
  reload: true,
  isGlobal: false,
  logLoaded: false
};

describe("load config", () => {
  it("loads the default config", async () => {
    const { dir, reload, ...opts } = defaultOpts;
    const config = copin<Config>(opts);
    expect(config).toBeDefined();
    expect(config.test).toBe("hurrah!");
    expect(config.fromEnv).toBeUndefined();
  });

  it("loads the default config (isGlobal: false)", () => {
    const { dir, ...opts } = defaultOpts;
    const config = copin<Config>({
      ...opts,
      includeEnvMapInTest: true
    });
    expect(config).toBeDefined();
    expect(config.test).toBe("hurrah!");
    expect(config.fromEnv).toBe("test");
  });

  it("loads config even when default does not exist", () => {
    const config = copin<Config>({
      ...defaultOpts,
      dir: "./test/fixtures/config-no-default",
      includeEnvMapInTest: true
    });
    expect(config).toBeDefined();
    expect(config.fromTest).toBe("set by test.ts");
    expect(config.fromEnv).toBe("test");
  });

  it("uses cached config", () => {
    const config = copin<Config>({ ...defaultOpts, isGlobal: true });
    const config2 = copin<Config>({
      ...defaultOpts,
      isGlobal: true,
      reload: false
    });
    expect(config).toBe(config2);
  });

  it("NODE_ENV config overrides default config", () => {
    const config = copin<Config>(defaultOpts);
    expect(config.fromDefault).toBe("Hello World!");
    expect(config.fromTest).toBe("set by test.ts");
  });

  describe("custom config when COPIN_CONFIG is set", () => {
    beforeAll(() => {
      process.env.COPIN_CONFIG = "copin";
    });
    afterAll(() => {
      process.env.COPIN_CONFIG = "";
    });

    it("custom config overrides NODE_ENV", () => {
      const config = copin<Config>({ ...defaultOpts });
      expect(config.fromCustom1).toBe("set by copin.ts");
    });
  });

  describe("multi custom config when COPIN_CONFIG is set with list", () => {
    beforeAll(() => {
      process.env.COPIN_CONFIG = "copin, copin2";
    });
    afterAll(() => {
      process.env.COPIN_CONFIG = "";
    });

    it("custom configs override NODE_ENV", () => {
      const config = copin<Config>({ ...defaultOpts, logLoaded: true });
      expect(config.fromCustom1).toBe("set by copin.ts");
      expect(config.fromCustom2).toBe("set by copin2.ts");
    });
  });

  it("external config overrides NODE_ENV config", () => {
    const config = copin<Config>({
      ...defaultOpts,
      extConfig: { fromExt: "set by external config" }
    });
    expect(config.fromExt).toBe("set by external config");
  });

  it("local config overrides everything", () => {
    const config = copin<Config>({
      ...defaultOpts,
      dir: "./test/fixtures/config-with-local",
      extConfig: { fromLocal: "set by external config" },
      includeLocalInTest: true
    });
    expect(config.fromLocal).toBe("set by local.ts");
  });

  it("local config not loaded when NODE_ENV==test", () => {
    const config = copin<Config>({
      ...defaultOpts,
      dir: "./test/fixtures/config-with-local"
    });
    expect(config.fromTest).toBe("set by test.ts");
  });

  it("local config is loaded when NODE_ENV==test and includeLocalInTest is true", () => {
    const config = copin<Config>({
      ...defaultOpts,
      includeLocalInTest: true,
      dir: "./test/fixtures/config-with-local"
    });
    expect(config.fromTest).toBe("set by local.ts");
  });

  describe("local config when NODE_ENV='production'", () => {
    beforeAll(() => {
      process.env.NODE_ENV = "production";
    });
    afterAll(() => {
      process.env.NODE_ENV = "test";
    });

    it("local config not loaded when NODE_ENV==production", () => {
      const config = copin<Config>({
        ...defaultOpts,
        dir: "./test/fixtures/config-with-local"
      });
      expect(config.node.env).toBe("production");
      expect(config.fromTest).toBe("set by default.ts");
    });

    it("local config is loaded when NODE_ENV==production and includeLocalInProduction is true", () => {
      const config = copin<Config>({
        ...defaultOpts,
        includeLocalInProduction: true,
        dir: "./test/fixtures/config-with-local"
      });
      expect(config.fromTest).toBe("set by local.ts");
    });
  });

  describe("unreadable config file", () => {
    beforeAll(() => {
      fs.chmodSync("./test/fixtures/config-unreadable/default.ts", 0o244);
    });
    afterAll(() => {
      fs.chmodSync("./test/fixtures/config-unreadable/default.ts", 0o644);
    });

    it("throws an error on unreadable config file", async () => {
      expect(() =>
        copin<Config>({
          ...defaultOpts,
          dir: "./test/fixtures/config-unreadable"
        })
      ).toThrow(
        "EACCES: permission denied, open '/Users/jason/dev/copin/test/fixtures/config-unreadable/default.ts'"
      );
    });
  });

  it("loads js config files", () => {
    const config = copin<Config>({
      ...defaultOpts,
      dir: "./test/fixtures/config-js",
      logLoaded: false
    });
    expect(config.fromDefault).toBe("Hello World!");
    expect(config.fromTest).toBe("set by test.ts");
  });

  describe("missing mode config", () => {
    it("ignores missing mode config", async () => {
      const config = copin<Config>({
        ...defaultOpts,
        dir: "./test/fixtures/config-no-mode"
      });
      expect(config.fromDefault).toBe("Hello World!");
      expect(config.fromTest).toBe("set by default.ts");
    });

    it("warns on missing mode config", async () => {
      const log: any[] = [];
      const origLog = console.log;
      console.log = (msg: any) => {
        log.push(msg);
      };
      const config = copin<Config>({
        ...defaultOpts,
        dir: "./test/fixtures/config-no-mode",
        alertNoNodeEnvConfig: "warn"
      });
      console.log = origLog;
      expect(log[0]).toEqual(
        "WARN: config not found for NODE_ENV at ./test/fixtures/config-no-mode/test"
      );
      expect(config.fromDefault).toBe("Hello World!");
      expect(config.fromTest).toBe("set by default.ts");
    });

    it("throws an error on missing mode config", () => {
      expect(() =>
        copin<Config>({
          ...defaultOpts,
          dir: "./test/fixtures/config-no-mode",
          alertNoNodeEnvConfig: "error"
        })
      ).toThrow();
    });
  });

  describe("empty mode config", () => {
    it("ignores empty mode config", async () => {
      const config = copin<Config>({
        ...defaultOpts,
        dir: "./test/fixtures/config-empty-mode"
      });
      expect(config.fromDefault).toBe("Hello World!");
      expect(config.fromTest).toBe("set by default.ts");
    });

    it("warns on empty mode config", async () => {
      const log: any[] = [];
      const origLog = console.log;
      console.log = (msg: any) => {
        log.push(msg);
      };
      const config = copin<Config>({
        ...defaultOpts,
        dir: "./test/fixtures/config-empty-mode",
        alertNoNodeEnvConfig: "warn"
      });
      console.log = origLog;
      expect(log[0]).toEqual(
        "WARN: config not found for NODE_ENV at ./test/fixtures/config-empty-mode/test"
      );
      expect(config.fromDefault).toBe("Hello World!");
      expect(config.fromTest).toBe("set by default.ts");
    });

    it("errors on empty mode config", async () => {
      expect(() =>
        copin<Config>({
          ...defaultOpts,
          dir: "./test/fixtures/config-empty-mode",
          alertNoNodeEnvConfig: "error"
        })
      ).toThrow();
    });
  });

  describe("ENV_MAP", () => {
    it("loads ENV vars according to ENV_MAP", async () => {
      const config = copin<Config>({
        ...defaultOpts,
        includeEnvMapInTest: true
      });
      expect(config.node.env).toBe("test");
    });

    it("ENV vars override NODE_ENV config and default config", async () => {
      const config = copin<Config>({
        ...defaultOpts,
        includeEnvMapInTest: true
      });
      expect(config.fromEnv).toBe("test");
    });

    it("unset ENV vars do not override config", async () => {
      const config = copin<Config>(defaultOpts);
      expect(config.envMapped).toBe("set by default.ts");
    });
  });
});

describe("no accessors", () => {
  it("allows direct access", () => {
    const config = copin<Config>(defaultOpts);
    expect(config.fromDefault).toBe("Hello World!");
    expect(config.it.is.deep).toBe("deeep");
  });
});
