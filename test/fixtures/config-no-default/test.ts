import { Config } from "../types";

const config: Partial<Config> = {
  dir: "config-no-default",

  fromTest: "set by test.ts",
  fromEnv: "set by test.ts"
};

export { config };
