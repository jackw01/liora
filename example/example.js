const path = require('path');
const commandLineArgs = require('command-line-args');
const liora = require('../src/liora-core.js');

// If --configDir is specified as a command line argument, use it
const options = commandLineArgs([{ name: 'configDir', defaultValue: '' }]);
if (options.configDir !== '') liora.setConfigDirectory(options.configDir);

// Add the absolute path to the 'modules' folder as a module source
liora.addModuleSource(path.join(__dirname, 'modules'));

// Load the bot
liora.load();
