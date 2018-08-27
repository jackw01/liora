const commandLineArgs = require("command-line-args");
const liora = require("../src/liora-core.js");

const options = commandLineArgs([{ name: "configDir", defaultValue: "" }]);
if (options.configDir != "") liora.setConfigDirectory(options.configDir);

liora.load();
