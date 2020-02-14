import { Config } from "../types";

const config: Partial<Config> = {
  node: {
    env: "NODE_ENV"
  },
  fromEnv: "NODE_ENV"
};

export { config };
