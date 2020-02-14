import { Config } from "../types";

const config: Partial<Config> = {
  fromTest: "set by test.ts",
  fromEnv: "set by test.ts",
  fromExt: "set by test.ts",
  fromCustom1: "set by test.ts",
  fromCustom2: "set by test.ts"
};

export { config };
