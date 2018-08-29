# Liora
Modular and extensible Node.js discord-bot with lots of built-in functionality

## User Guide
This guide assumes that you have created an application for your bot at https://discordapp.com/developers/applications/ and obtained a bot token.

### Standalone Usage
With Liora globally installed, run `liora` to run using the default config folder at `~/.liora-bot/`. An optional config directory can be specified with the `--configDir` option. The first time Liora is run, it will create a blank config file. The `discordToken` property will need to be filled in with your bot token before the bot can connect to Discord. In standalone mode, only built-in modules will be accessible.

### Customizable Usage

#### Loader script
To add your own functionality, just create an empty Node.js project and install and require Liora. Set a custom config folder if you want to and add a folder as a module source.

`main.js`
```javascript
const path = require("path");
const liora = require("liora");

// If setConfigDirectory is not called, Liora will use the default at ~/.liora-bot/
liora.setConfigDirectory("path/to/your/config/directory");

// Call addModuleSource with the absolute path to a directory to make that directory a module source
// Your custom modules will go in this folder and it is possible to add multiple module sources
// Liora will still load its internal modules in addition to yours
liora.addModuleSource(path.join(__dirname, "modules"));

// Start the bot
liora.load();
```

Liora's dynamic module loader allows you to load, unload, and reload modules from Discord commands without restarting the bot from the command line. This requires that all modules are in a standard format and are located inside folders that are set as module sources.

#### Module format
Liora loads modules using the path `absolute-path-to-module-source/module-name/main.js`. This means that all modules must consist of a folder with the name of the module containing a `main.js` file.

Modules can be a subfolder within your custom bot (recommended) or they can be individual Node.js modules with their own `package.json` file and `node_modules` folder (possible, but not recommended because of the redundant `node_modules` folders).

#### Module main.js
`module-name/main.js`

Module init function - called after bot is connected and in servers.
Use this for initializing per-server module state information or similar things.
`bot` is the Liora instance that called this function.
```javascript
module.exports.init = async function(bot) {
}
```

Module commands object - all commands should be defined here.
Format:
```javascript
// commandname is how the users will run a command and MUST be all lowercase
"commandname": {

    // Description of the command (not arguments) that will be displayed in the help text
    description: "description",

    // Array of argument names: follow the provided format
    argumentNames: ["<requiredArgument>", "<optionalArgument>?"],

    // Permission level: "all" for all users, "owner" for owner, "manager" or anything else for a group
    permissionLevel: "all",

    // Function that performs the command: must accept three arguments
    //   args: array of arguments that the user executed the command with
    //   msg: Discord.js message object that the command was found in
    //   bot: the Liora instance calling this function
    execute: async function(args, msg, bot) {
        // Do the command here
    }
}
```

Example:
```javascript
module.exports.init = async function(bot) {
}

module.exports.commands = {

    "ping": {
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            msg.channel.send("pong");
        }
    }
}
```

See `liora-core-commands` in the modules folder for an example module.

#### Liora object properties and methods

##### Properties
###### `bot.client`
The currently in-use [Discord.js `client` instance](https://discord.js.org/#/docs/main/stable/class/Client)

###### `bot.log`
[Winston logger](https://github.com/winstonjs/winston) instance that can be used for logging to the console.

###### `bot.firstLoadTime`
`Date` object representing the time when the bot first loaded.

###### `bot.lastLoadTime`
`Date` object representing the time when the bot last loaded.

###### `bot.lastLoadDuration`
Number representing the time it took for the bot to load in milliseconds.

##### Methods
###### `bot.setConfigDirectory(configDir)`
Sets the configuration folder used by the bot.

###### `bot.addModuleSource(directory)`
Adds a folder by absolute path as a source for modules.

###### `bot.load()`
Initializes the bot and connects to Discord. This function should only be called once.

###### `bot.saveConfig(callback)`
Saves the current configuration data object to the config file. `callback` will be called with an error object if saving fails.

###### `bot.loadModule(name, callback)`
Loads a module by name from any module source. `callback` will be called with an error object if loading fails.

###### `bot.unloadModule(name, callback)`
Unloads a module by name and clears the `require` cache. `callback` will be called with an error object if unloading fails.

###### `bot.initModule(name, callback)`
Calls the init function on a module by name. `callback` will be called with an error object if initialization fails.

###### `bot.prefixForMessageContext(msg)`
Returns the bot's command prefix for the context of a Discord.js message object.

###### `bot.hasPermission(member, user, group, role)`
Returns `true` if a user meets the criteria for the specified permission `group` or `role`. Requires a Discord.js `GuildMember` object (or `null` if not in a server), a Discord.js `User` object, a group name, and a Discord.js `Snowflake` with the role ID.

Either `group` or `role` may be empty strings. If both are specified, any this function will return `true` if the user matches **either** `group` or `role`.

###### `bot.getCommandNamed(name, callback)`
Searches all loaded modules for a command with the specified name. `callback` will be called with either no arguments or the requested command object.

## Todo
- [x] login to discord
- [x] config loader
- [x] config schema
- [x] logging
- [x] run commands
- [x] internal module loading
- [x] external module loading
- [x] sample bot with custom modules
- [ ] fancy colored logging
- [x] permissions by user
- [x] permissions by role
- [x] set permission group commands
- [ ] set permission role commands
- [ ] load modules with commands
- [x] help command
- [x] command list
- [ ] set config commands
- [ ] message listeners
- [ ] per-server settings
- [ ] reload module command
- [ ] reload all modules command
- [x] set nick command
- [ ] set command group permission commands
- [ ] set command role permission commands
- [ ] nick utility commands
- [x] role utility commands
- [ ] use username instead of id
- [ ] use role instead of id
- [ ] command aliases
- [ ] youtube player
- [ ] youtube player on multiple servers
- [ ] youtube player queue and shuffle
- [ ] automatic responses
- [ ] automatic responses regex and random choice
- [ ] weather
- [ ] urban dictionary
- [ ] xkcd
- [ ] error recovery
- [ ] full reload and restart command

### Minor issues
- [ ] prevent config dir being changed when bot is loaded
- [ ] use setter/getter methods for module config
- [ ] fix load/unload module
