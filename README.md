<h1 align="center">
	<br>
	<img width="400" src="graphics/liora-logo-01.png" alt="Liora">
	<br>
	<br>
</h1>

 > Modular and extensible Node.js discord-bot with lots of built-in functionality

## Is It a Bot or a Framework?
Liora can be used as a standalone bot with all of the commands in its built-in modules. It can also be used as a framework for developing custom Discord bot functionality in Javascript without having to worry about dynamic module loading, handling commands, or parsing user/role/channel mentions in messages.

## User Guide
This guide assumes that you have created an application for your bot at https://discordapp.com/developers/applications/ and obtained a bot token, and added the bot to your server(s). There are many good guides out there already.

Liora is built for ease of self-hosting for individual servers and not as a centrally hosted bot.

### Standalone Usage
Thanks to the simplicity of Node.js and npm, Liora is very easy to install and run for self-hosting.

1. Install Node.js 8.0.0 or higher on your system: https://nodejs.org/en/download/
2. Install Liora globally: `npm install -g git+https://github.com/jackw01/liora.git`
3. Run `liora` to run using the default configuration folder at `~/.liora-bot/` or run `liora --configDir .` to use the current folder as the configuration folder.
4. The `config.json` file inside the config folder will open. Paste your bot token into the `discordToken` property.
5. Run `liora` again to connect to Discord.

An optional config directory can be specified with the `--configDir` option. The first time Liora is run, it will create a blank config file. In standalone mode, only built-in modules will be accessible.

Note: For long term use, use [forever](https://www.npmjs.com/package/forever) to keep the bot running if it ever crashes.

### Customizable Usage
For developers who want to add their own functionality to their bot.

#### Loader script
**See the `example` folder for an example loader with a custom module and command line arguments.**

To add your own functionality, just create an empty Node.js project and install and require Liora. Set a custom config folder if you want to and add a folder as a module source.

`main.js`
```javascript
const path = require('path');
const liora = require('liora');

// If setConfigDirectory is not called, Liora will use the default at ~/.liora-bot/
liora.setConfigDirectory('path/to/your/config/directory');

// Call addModuleSource with the absolute path to a directory to make that directory a module source
// Your custom modules will go in this folder and it is possible to add multiple module sources
// Liora will still load its internal modules in addition to yours
liora.addModuleSource(path.join(__dirname, 'modules'));

// Start the bot
liora.load();
```

Liora's dynamic module loader allows you to load, unload, and reload modules from Discord commands without restarting the bot from the command line. This requires that all modules are in a standard format and are located inside folders that are set as module sources.

### Module format
**See `modules/liora-core-commands/main.js` for an example module.**

Liora loads modules using the path `absolute-path-to-module-source/module-name/main.js`. This means that all modules must consist of a folder with the name of the module containing a `main.js` file.

Modules can be a subfolder within your custom bot's Node.js package (recommended) or they can be individual Node.js modules with their own `package.json` file and `node_modules` folder (possible, but not recommended because of the redundant `node_modules` folders).

#### Module main.js
`module-name/main.js`

###### Optional: Module init function
Called after bot is connected and in servers.

Use this for initializing per-server module state information or similar things.
`bot` is the Liora instance that called this function.
This function is optional.
```javascript
module.exports.init = async function(bot) {
}
```

###### Module commands array
All commands should be defined here.

Format:
```javascript
{
  // Name of the command (what users will type to run it) - must be lowercase
  name: 'command',

  // Description of the command (not arguments) that will be displayed in the help text
  description: 'description',

  // Array of argument names: follow the provided format
	// If the command is called by a user with too *few* arguments, an error message will be sent
	// to the channel it was called from and execute() will not be called.
  argumentNames: ['<requiredArgument>', '<optionalArgument>?'],

  // Permission level: 'all' for all users, 'owner' for owner, 'manager' or anything else for a group
	// There is no need for checking permissions inside of your command, the bot does this for you.
  permissionLevel: 'all',

  // Array of default aliases (alternate ways of running this command)
  aliases: ['alternate1', 'alternate2'],

  // Function that performs the command: must accept three arguments
  //   args: array of arguments that the user executed the command with
  //   msg: Discord.js message object that the command was found in
  //   bot: the Liora instance calling this function
  async execute(args, msg, bot) {
    // Do the command here
  }
}
```

Example:
```javascript
module.exports.init = async function(bot) {
	// Run initialization task
}

module.exports.commands = [
  {
    name: 'command',
    description: 'Command description here.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      // Get result of command here
      msg.channel.send(result);
    },
  },
];

```

**See `modules/liora-core/main.js` and `modules/liora-utils/main.js` for an example module.**

###### Optional: Module middleware array
Middleware to pass all messages through can be defined here. This can be useful for detecting certain text in messages, analyzing message content, or preventing commands from being executed in certain conditions.

Format:
```javascript
// c: context object (c.bot, c.message represent the bot and message)
// next: next function in the middleware chain
(c, next) => {
	if (condition) {
		// Send message to the channel of the message in context
		c.message.channel.send(message);

		// If return is called, the middleware chain stops and commands in the message will not be parsed and executed
		return;
	}

	// To continue to the next middleware, call next()
  next();
}
```

**See example of custom middleware usage in `modules/liora-autorespond/main.js` and `modules/liora-utils/main.js`.**

### Liora object properties and methods

#### Properties
###### `bot.client`
The currently in-use [Discord.js `client` instance](https://discord.js.org/#/docs/main/stable/class/Client)

###### `bot.log`
[Winston logger](https://github.com/winstonjs/winston) instance that can be used for logging to the console. Use `bot.log.modinfo()` and `bot.log.modwarn()` inside of custom modules so that core and module messages can be differentiated.

#### Methods

###### `bot.setConfigDirectory(configDir)`
Sets the configuration folder used by the bot. Do not use this after the bot has loaded.

###### `bot.addModuleSource(directory)`
Adds a folder by absolute path as a source for modules.

###### `bot.load()`
Initializes the bot and connects to Discord. This function should only be called once.

###### `bot.saveConfig(callback)`
Saves the current configuration data object to the config file. `callback` will be called with an error object if saving fails.

###### `bot.saveConfigAndAck(message)`
Saves the current configuration data object to the config file. Reacts to the message with a green check mark emoji if successful and sends an error message in the same channel if not.

###### `bot.configHas(pathToProperty)`
Returns true if config has a property at the specified path.

###### `bot.configGet(pathToProperty, defaultValue)`
Returns the value stored in config at the specified path or returns `defaultValue` if it is not present.

###### `bot.configSet(pathToProperty, value)`
Sets the value stored in config at the specified path to `value`.

###### `bot.configSetDefault(pathToProperty, defaultValue)`
Sets the value stored in config at the specified path to `defaultValue` if it is not set already. Returns true if the value has not been set already, otherwise false.

###### `bot.configUnset(pathToProperty)`
Deletes the value stored in config at the specified path.

###### `bot.sendEmojiEmbed(channel, emoji, title, description)`
Send an embed to the channel with an emoji, title, and description.

###### `bot.sendError(channel, title, description)`
Send an embed to the channel with a red X emoji (❌) to indicate error, a title, and a description.

###### `bot.sendSuccess(channel, title, description)`
Send an embed to the channel with a check mark emoji (✅) to indicate success, a title, and a description.

###### `bot.sendInfo(channel, title, description)`
Send an embed to the channel with an info emoji (ℹ️) to indicate an info message, a title, and a description.

###### `bot.prefixForMessageContext(msg)`
Returns the bot's command prefix for the context of a Discord.js message object. Returns the server-specific prefix if one is set, otherwise returns the global prefix.

#### Discord utility methods
###### `bot.util.username(user)`
Returns a Discord.js user object's username and discriminator as a string for displaying to users

###### `bot.util.isSnowflake(string)`
Returns true if a string fits the format of a snowflake ID used by Discord.

###### `bot.util.parseUsername(userString, server)`
Returns an array of Discord.js member objects from a string containing a user mention, name, or id. `server` is a Discord.js `Guild` object.

###### `bot.util.parseRole(roleString, server)`
Returns an array of Discord.js role objects from a string containing a role mention or name. `server` is a Discord.js `Guild` object.

###### `bot.util.parseChannel(channelString, server)`
Returns an array of Discord.js channel objects from a string containing a channel mention or name. `server` is a Discord.js `Guild` object.

#### Bot internals
These properties and methods are in a separate section since they will rarely be used outside of the `liora-core` module.

###### `bot.firstLoadTime`
`Date` object representing the time when the bot first loaded.

###### `bot.lastLoadTime`
`Date` object representing the time when the bot last loaded.

###### `bot.lastLoadDuration`
Number representing the time it took for the bot to load in milliseconds.

###### `bot.loadModule(name, callback)`
Loads a module by name from any module source. `callback` will be called with an error object if loading fails.

###### `bot.unloadModule(name, callback)`
Unloads a module by name and clears the `require` cache. `callback` will be called with an error object if unloading fails.

###### `bot.initModule(name, callback)`
Calls the init function on a module by name. `callback` will be called with an error object if initialization fails.

###### `bot.getCommandNamed(name, callback)`
Searches all loaded modules for a command with the specified name. `callback` will be called with either no arguments or the requested command object.

###### `bot.hasPermission(member, user, group, role)`
Returns `true` if a user meets the criteria for the specified permission `group` or `role`. Requires a Discord.js `GuildMember` object (or `null` if not in a server), a Discord.js `User` object, a group name, and a Discord.js `Snowflake` with the role ID.

Either `group` or `role` may be empty strings. If both are specified, this function will return `true` if the user matches **either** `group` or `role`.

###### `bot.restart()`
Reloads all modules and config and reconnects to Discord.

###### `bot.shutdown()`
Disconnects from Discord and ends the process.

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
- [x] display aliases in help
- [x] openConfig command line arg
- [ ] command docs generator

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
- [x] reddit image search
- [x] reddit gif search
- [x] reddit image by sub
- [x] dice
- [x] wikipedia
- [x] 8 ball
- [x] poll
- [x] fortune
- [x] translate last message
- [x] reverse search last image
- [x] general purpose translate
- [ ] imgur
- [ ] text with regional indicators
- [ ] rotating motd
- [ ] tell command
- [ ] reverse profile pic

## License
MIT
