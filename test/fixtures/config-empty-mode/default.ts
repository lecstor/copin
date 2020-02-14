import { Config } from "../types";

const config: Partial<Config> = {
  dir: "config-empty-mode",

  // not overridden
  fromDefault: "Hello World!",

  // overidden by test
  fromTest: "set by default.ts",

  // overidden by test and ENV_MAP
  fromEnv: "set by default.ts",

  it: {
    is: {
      deep: "deeep"
    }
  }
};

export { config };
