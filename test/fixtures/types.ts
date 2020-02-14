export type Config = {
  dir: string;
  test: string;
  node: {
    env: string;
  };
  fromDefault: string;
  fromTest: string;
  fromEnv: string;
  fromExt: string;
  fromLocal: string;
  fromCustom1: string;
  fromCustom2: string;
  it: {
    is: {
      deep: string;
    };
  };
  envMapped: string;
};
