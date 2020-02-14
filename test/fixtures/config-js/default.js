exports.config = {
  dir: "config",

  // not overridden
  fromDefault: "Hello World!",

  // overidden by test
  fromTest: "set by default.ts",

  // overidden by test and ENV_MAP
  fromEnv: "set by default.ts",

  fromExt: "set by default.ts",

  it: {
    is: {
      deep: "deeep"
    }
  },

  envMapped: "set by default.ts"
};
