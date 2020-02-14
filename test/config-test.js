const copin = require("../dist").default;

const config = copin({ dir: "test/fixtures/config-js" });

console.log(config);
console.log(JSON.stringify(config));
