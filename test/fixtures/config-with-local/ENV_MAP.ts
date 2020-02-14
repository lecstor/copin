import { Config } from "../types";

const config: Partial<Config> = {
  node: {
    env: "NODE_ENV"
  },
  fromEnv: "NODE_ENV",
  fromLocal: "NODE_ENV",
  envMapped: "envMapped"
};

export { config };
