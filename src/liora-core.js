const os = require("os");
const path = require("path");
const fs = require("fs");
const commandLineArgs = require("command-line-args");
const mkdirp = require("mkdirp");
const jsonfile = require("jsonfile");
const _ = require("lodash");
const winston = require("winston");
const chalk = require("chalk");
const discord = require("discord.js");

const localModuleDirectory = "../modules";

// Logger
const logLevels = {error: 0, warn: 1, info: 2, modules: 3, modwarn: 4, modinfo: 5, debug: 6};

const logger = winston.createLogger({
    levels: logLevels,
    transports: [
        new winston.transports.Console({colorize: true, timestamp: true})
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.padLevels({levels: logLevels}),
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}:${info.message}`)
    ),
    level: "debug"
});

winston.addColors({
    error: "red",
    warn: "yellow",
    info: "green",
    modules: "cyan",
    modwarn: "yellow",
    modinfo: "green",
    debug: "blue"
});

// Config
const configSchema = {
    discordToken: {
        type: "string",
        default: "Paste your bot token here."
    },
    owner: {
        type: "string",
        default: ""
    },
    defaultGame: {
        type: "string",
        default: "$help for help"
    },
    prefix: {
        type: "string",
        default: "$"
    },
    activeModules: {
        type: "array",
        itemType: "string",
        default: ["core"]
    },
    commandAliases: {
        type: "object",
        default: {}
    },
    defaultColors: {
        type: "object",
        default: {
            neutral: {
                type: "string",
                default: "#287db4"
            },
            error: {
                type: "string",
                default: "#c63737"
            },
            success: {
                type: "string",
                default: "#41b95f"
            }
        }
    },
    settings: {
        type: "object",
        default: {}
    },
    groups: {
        type: "object",
        default: {}
    },
    commandPermissions: {
        type: "object",
        default: {}
    },
    serverPermissions: {
        type: "object",
        default: {}
    },
    modules: {
        type: "object",
        default: {}
    }
};

// Bot
const bot = {
    client: new discord.Client(),
    log: logger,
    moduleSources: [`${localModuleDirectory}`],
    firstLoadTime: Date.now()
};

// Set the config directory to use
bot.setConfigDirectory = function(configDir) {
    this.configDir = configDir;
    this.configFile = path.join(configDir, "config.json");
}

// Save config to file
bot.saveConfig = function(callback) {
    jsonfile.writeFile(this.configFile, bot.config, {spaces: 4, EOL: "\n"}, (err) => {
        if (err) {
            bot.log.error(chalk.red.bold(`Unable to save config.json: ${err.message}`));
            bot.log.info(`Config data: ${JSON.stringify(bot.config, null, 4)}`);
            callback(err);
        } else {
            callback();
        }
    });
}

// Load config file
bot.loadConfig = function(callback) {
    // If file does not exist, create it
    if (!fs.existsSync(this.configFile)) {
        try {
            mkdirp.sync(path.dirname(this.configFile));
            fs.writeFileSync(this.configFile, JSON.stringify({}, null, 4));
        } catch (err) {
            bot.log.error(chalk.red.bold(`Unable to create config.json: ${err.message}`));
            throw err;
        }
    }

    // Load the created file, even if it is empty
    bot.log.info("Loading config...");
    try {
        bot.config = JSON.parse(fs.readFileSync(this.configFile));
    } catch (err) {
        bot.config = {};
    }

    // Recursively iterate over the config to check types and reset properties to default if they are the wrong type
    function configIterator(startPoint, startPointInSchema) {
        for (var property in startPointInSchema) {
            if (startPointInSchema.hasOwnProperty(property) && !startPoint.hasOwnProperty(property)) {
                if (startPointInSchema[property].type != "object") {
                    startPoint[property] = startPointInSchema[property].default;
                } else {
                    startPoint[property] = {};
                }
            }
            if (startPointInSchema[property].type == "object") {
                configIterator(startPoint[property], startPointInSchema[property].default);
            }
            if (!Array.isArray(startPoint[property]) &&
                typeof startPoint[property] != startPointInSchema[property].type) {
                startPoint[property] = startPointInSchema[property].default;
            }
        }
    }
    configIterator(bot.config, configSchema);

    // Write the checked config data and open it again
    fs.writeFileSync(this.configFile, JSON.stringify(bot.config, null, 4));
    jsonfile.readFile(this.configFile, (err, obj) => {
        if (err) {
            bot.log.error(chalk.red.bold(`Unable to load config.json: ${err.message}`));
            throw err;
        } else {
            bot.config = obj;
            callback();
        }
    });
}

// Add source folder to search in when loading modules
bot.addModuleSource = function(directory) {
    if (fs.existsSync(directory)) this.moduleSources.push(directory);
    else bot.log.warn(chalk.yellow(`Module source ${directory} does not exist`));
}

// Load module
bot.loadModule = function(name, callback) {
    bot.log.modules(`Attempting to load module ${name}...`);
    if (!(name in this.modules)) {
        let found = false;
        this.moduleSources.forEach(directory => {
            let absolutePath = path.join(directory, `${name}`);
            if (directory == localModuleDirectory) absolutePath = path.join(__dirname, absolutePath);
            if (fs.existsSync(absolutePath)) {
                if (!fs.existsSync(path.join(absolutePath, "package.json"))) {
                    absolutePath = path.join(absolutePath, "main.js")
                }
                let newModule;
                try {
                    newModule = require(absolutePath);
                    newModule.path = absolutePath; // Set path property of module so we know the path to unload
                    newModule.defaultAliases = {};
                    newModule.commands.forEach(cmd => {
                        cmd.aliases.forEach(a => { newModule.defaultAliases[a] = cmd.name });
                    });
                } catch (err) {
                    bot.log.warn(chalk.red(`Unable to load module ${name}: ${err.message}`));
                    bot.log.warn(`> ${err.stack}`);
                    callback(err);
                    return;
                }
                this.modules[name] = newModule;
                bot.log.modules(chalk.green(`Loaded module ${name}`));
                found = true;
                callback();
            }
        });
        if (!found) {
            bot.log.warn(`Module ${name} not found`);
            callback(new Error(`Module ${name} not found`));
        }
    } else {
        bot.log.warn(`Module ${name} already loaded`);
        callback(new Error(`Module ${name} already loaded`));
    }
}

// Unload module
bot.unloadModule = function(name, callback) {
    bot.log.modules(`Attempting to unload module ${name}...`);
    if (name in this.modules) {
        delete require.cache[require.resolve(this.modules[name].path)];
        delete this.modules[name];
        bot.log.modules(chalk.green(`Unloaded module ${name}`));
        callback();
    } else {
        bot.log.warn(`Module ${name} not currently loaded`);
        callback(new Error(`Module ${name} not currently loaded`));
    }
}

// Initialize module
bot.initModule = function(name, callback) {
    if (name in this.modules) {
        this.modules[name].init(this).then(() => {
            bot.log.modules(chalk.green(`Initialized module ${name}`));
            callback();
        }).catch(err => {
            bot.log.warn(chalk.red(`Failed to initialize module ${name}: ${err.message}`));
            callback(err);
        });
    } else {
        bot.log.warn(`Module ${name} not currently loaded`);
        callback(new Error(`Module ${name} not currently loaded`));
    }
}

// Return the correct command prefix for the context of a message
bot.prefixForMessageContext = function(msg) {
    if (msg.guild && _.has(this.config.settings, `[${msg.guild.id}].prefix`)) {
        return this.config.settings[msg.guild.id].prefix;
    } else {
        return this.config.prefix;
    }
}

// Does this user have group/role permission on this server?
// Returns true in these cases:
//   If the user is the bot owner
//   If the permission group is all users
//   If the user is in the global permission group
//   If the user is in the permission role on this server
bot.hasPermission = function(member, user, group, role) {
    if (user.id == this.config.owner) return true;
    if (group == "all") return true;
    if (Object.keys(this.config.groups).includes(group) &&  this.config.groups[group].includes(user.id)) return true;
    if (member && member.roles.has(role)) return true;
    return false;
}

// Returns the command object for a command name
bot.getCommandNamed = function(command, callback) {
    const moduleNames = Object.keys(this.modules);
    // Search for configured and default aliases
    if (command in this.config.commandAliases) command = this.config.commandAliases[command];
    else moduleNames.forEach(name => { command = this.modules[name].defaultAliases[command] || command });
    moduleNames.forEach(name => {
        const found = this.modules[name].commands.find(cmd => cmd.name == command);
        if (found) {
            callback(found);
            return;
        }
    });
    callback();
}

// Initialize and load the bot
bot.load = function() {
    // Set up some properties
    this.lastLoadTime = Date.now();
    this.config = {};
    this.modules = {};

    // Load config, load modules, and login
    this.loadConfig(() => {
        this.log.info("Loading modules...");
        this.config.activeModules.forEach(module => { this.loadModule(module, err => {}) });
        this.log.info("Connecting...");
        this.client.login(this.config.discordToken);
    });
}

// Disconnect and end the process
bot.shutdown = function() {
    bot.log.info("Shutting down...");
    this.client.destroy().then(() => {});
}

// Disconnect, unload all modules, and reconnect
bot.restart = function() {
    bot.log.info("Restarting: resetting client...");
    this.client.destroy().then(() => {
        this.config.activeModules.forEach(module => { bot.unloadModule(module, err => {}) });
        this.load();
    });
}

// Called when client logs in
bot.client.on("ready", () => {
    bot.log.info(chalk.cyan(`Logged in as: ${bot.client.user.username} (id: ${bot.client.user.id})`));
    bot.client.user.setActivity(bot.config.defaultGame);

    // Update permissions config for servers
    const servers = bot.client.guilds.array();
    servers.forEach(server => {
        if (!_.has(bot.config, `serverPermissions[${server.id}]`)) {
            _.set(bot.config, `serverPermissions[${server.id}]`, {});
            bot.saveConfig(err => {});
        }
    });

    // Init modules
    const moduleNames = Object.keys(bot.modules);
    var moduleCount = 0;
    moduleNames.forEach(name => {
        bot.initModule(name, err => {
            if (!err && ++moduleCount >= moduleNames.length) bot.lastLoadDuration = Date.now() - bot.lastLoadTime;
        });
    });
});

// Message dispatching
bot.client.on("message", async msg => {
    // Check if message is command and do not respond to other bots
    if (!msg.author.bot && msg.content.indexOf(bot.prefixForMessageContext(msg)) === 0) {
        const args = msg.content.slice(bot.prefixForMessageContext(msg).length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        bot.log.debug(`Detected command ${command} with args ${args.join(" ")}`);
        bot.getCommandNamed(command, cmd => {
            if (cmd) {
                if (args.length >= _.filter(cmd.argumentNames, i => !_.endsWith(i, "?")).length) {

                    // Determine permission level for the message context
                    // Use the global group override and the role override if they exist
                    const permissionLevel = bot.config.commandPermissions[command] || cmd.permissionLevel;
                    const roleOverride = msg.guild ? bot.config.serverPermissions[msg.guild.id][command] || "" : "";
                    if (bot.hasPermission(msg.member, msg.author, permissionLevel, roleOverride)) {

                        // Execute the command with args, message object, and bot object
                        cmd.execute(args, msg, bot).catch(err => {
                            msg.channel.send(`❌ Error executing command \`${command}\`: ${err.message}`);
                        });
                    } else {
                        msg.channel.send("🔒 You do not have permission to use this command.");
                    }
                } else {
                    msg.channel.send(`❌ Not enough arguments. Use \`${bot.prefixForMessageContext(msg)}${command} ${cmd.argumentNames.join(" ")}\`: ${cmd.description}`);
                }
            }
        });
    }
    // run listeners
});

// Set default config directory
bot.setConfigDirectory(path.join(os.homedir(), ".liora-bot"));

// Run the bot automatically if module is run instead of imported
if (!module.parent) {
    bot.log.info(chalk.cyan("Liora is running in standalone mode"));
    const options = commandLineArgs([{ name: "configDir", defaultValue: "" }]);
    if (options.configDir != "") bot.setConfigDirectory(options.configDir);
    bot.load();
}

module.exports = bot;
