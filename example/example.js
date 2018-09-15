// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).
// Example usage

const path = require('path');
const commandLineArgs = require('command-line-args');
const liora = require('../src/liora-core.js');

// If --configDir is specified as a command line argument, use it
// If setConfigDirectory is not called, Liora will use the default at ~/.liora-bot/
const options = commandLineArgs([{ name: 'configDir', defaultValue: '' }]);
if (options.configDir !== '') liora.setConfigDirectory(options.configDir);

// Call addModuleSource with the absolute path to a directory to make that directory a module source
// Your custom modules will go in this folder and it is possible to add multiple module sources
// Liora will still load its internal modules in addition to yours
liora.addModuleSource(path.join(__dirname, 'modules'));

// Start the bot
liora.load();
