# Liora
Modular and extensible Node.js discord-bot with lots of built-in functionality

## Is It a Bot or a Framework?
Liora can be used as a standalone bot with all of the commands in its built-in modules. It can also be used as a framework for fast and easy development of custom bot functionality with Node.js.

## User Guide
This guide assumes that you have created an application for your bot at https://discordapp.com/developers/applications/ and obtained a bot token.

### Standalone Usage
1. Install Node.js 8.0.0 or higher on your system: https://nodejs.org/en/download/
2. Install Liora globally: `npm install -g git+https://github.com/jackw01/liora.git`
3. Run `liora` to run using the default configuration folder at `~/.liora-bot/`.
4. Stop Liora once it has initialized.
5. Open `config.json` inside the config folder and paste your bot token into the `discordToken` property.
6. Run `liora` again to connect to Discord.
7. Add the bot to your server(s).

An optional config directory can be specified with the `--configDir` option. The first time Liora is run, it will create a blank config file. In standalone mode, only built-in modules will be accessible.

### Customizable Usage
For developers who want to add their own functionality to their bot.

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

Module commands array - all commands should be defined here.
Format:
```javascript
{
    // Name of the command (what users will type to run it) - must be lowercase
    name: "command",

    // Description of the command (not arguments) that will be displayed in the help text
    description: "description",

    // Array of argument names: follow the provided format
    argumentNames: ["<requiredArgument>", "<optionalArgument>?"],

    // Permission level: "all" for all users, "owner" for owner, "manager" or anything else for a group
    permissionLevel: "all",

    // Array of default aliases (alternate ways of running this command)
    aliases: ["alternate1", "alternate2"],

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

module.exports.commands = [
    {
        name: "ping",
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            msg.channel.send("pong");
        }
    }
]
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
### Core
- [x] login to discord
- [x] config loader
- [x] config schema
- [x] logging
- [x] run commands
- [x] internal module loading
- [x] external module loading
- [x] sample bot with custom modules
- [x] colored logging
- [x] permissions by user
- [x] permissions by role
- [x] middleware support
- [x] per-server settings
- [x] use username instead of id
- [x] use role instead of id
- [x] command aliases
- [x] automatic responses
- [x] automatic responses regex and random choice
- [x] error logging
- [x] rate limit
- [x] default aliases
- [ ] display aliases in help

### Commands for builtin modules
- [x] load modules
- [x] reload module
- [x] reload all modules
- [x] full reload and restart
- [x] info
- [x] help
- [x] list
- [x] get/set config
- [x] set permission group
- [x] set command group permission
- [x] set command role permission
- [x] nick utility
- [x] role utility
- [x] set nick
- [x] youtube search
- [x] youtube player
- [x] youtube player on multiple servers
- [x] youtube player queue and shuffle
- [x] server info
- [x] channel info
- [x] role list
- [x] user info
- [x] role info
- [x] weather
- [x] urban dictionary
- [x] xkcd
- [x] get profile picture
- [x] get server icon
- [ ] reddit image search
- [ ] dice
- [ ] wikipedia
- [ ] 8 ball
- [x] poll
- [ ] remindme
- [ ] translate last message
