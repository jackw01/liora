// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).
// Example usage

const path = require('path');
const liora = require('liora');

const args = require('yargs')
  .usage('Usage: liora [options]')
  .example('liora --configDir .', 'run using the current directory as the config directory')
  .alias('c', 'configDir')
  .nargs('c', 1)
  .describe('c', 'Config directory (defaults to ~/.liora-bot/)')
  .boolean('openConfig')
  .describe('openConfig', 'Open config.json in the default text editor')
  .help('h')
  .alias('h', 'help')
  .epilog('Liora Discord bot example copyright 2018 jackw01. Released under the MIT license.')
  .argv;

// If --configDir is specified as a command line argument, use it
// If setConfigDirectory is not called, Liora will use the default at ~/.liora-bot/
if (args.configDir) liora.setConfigDirectory(args.configDir);
if (args.openConfig) liora.openConfigFile();
else {
  // If not opening config, start the bot

  // Call addModuleSource with the absolute path to a directory to make that directory a module source
  // Your custom modules will go in this folder and it is possible to add multiple module sources
  // Liora will still load its internal modules in addition to yours
  liora.addModuleSource(path.join(__dirname, 'modules'));

  // Start the bot
  liora.load();
}
