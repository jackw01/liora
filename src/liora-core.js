const os = require("os");
const path = require("path");
const fs = require("fs");
const commandLineArgs = require("command-line-args");
const mkdirp = require("mkdirp");
const jsonfile = require("jsonfile");
const winston = require("winston");
const discord = require("discord.js");

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
        default: ""
    },
    owner: {
        type: "string",
        default: ""
    },
    defaultGame: {
        type: "string",
        default: "$info for help"
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
    permissions: {
        type: "object",
        default: {}
    },
    modules: {
        type: "object",
        default: {}
    }
};

// Bot
const bot = {client: new discord.Client(), log: logger, firstLoadTime: Date.now()};

// Save config to file
bot.saveConfig = function(callback) {
    jsonfile.writeFile(this.configFile, bot.config, {spaces: 4, EOL: "\n"}, (err) => {
        if (err) {
            bot.log.error(`Unable to save config.json: ${err.message}`);
            bot.log.info(`Config data: ${JSON.stringify(bot.config, null, 4)}`);
            callback(err);
        } else {
            callback();
        }
    });
}

// Load config file
bot.loadConfig = function(callback) {
    if (!fs.existsSync(this.configFile)) {
        try {
            mkdirp.sync(path.dirname(this.configFile));
            fs.writeFileSync(this.configFile, JSON.stringify({}, null, 4));
        } catch (err) {
            bot.log.error(`Unable to create config.json: ${err.message}`);
            throw err;
        }
    }

    bot.log.info("Loading config...");
    try {
        bot.config = JSON.parse(fs.readFileSync(this.configFile));
    } catch (err) {
        bot.config = {};
    }

    function configIterator(startPoint, startPointInSchema) {
        for (var property in startPointInSchema) {
            if (startPointInSchema.hasOwnProperty(property) && !startPoint.hasOwnProperty(property)) {
                if (startPointInSchema[property].type != "object") {
                    startPoint[property] = startPointInSchema[property].default;
                } else
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
    fs.writeFileSync(this.configFile, JSON.stringify(bot.config, null, 4));

    jsonfile.readFile(this.configFile, (err, obj) => {
        if (err) {
            bot.log.error(`Unable to load config.json: ${err.message}`);
            throw err;
        } else {
            bot.config = obj;
            callback();
        }
    });
}

// Return the correct command prefix for the context of a message
bot.prefixForMessageContext = function(msg) {
    if (msg.guild && _.has(this.config.settings, `[${msg.guild.id}].prefix`)) {
        return this.config.settings[msg.guild.id].prefix;
    } else {
        return this.config.prefix;
    }
}

// Returns the command object
bot.getCommandNamed = function(command, callback) {
    if (command in this.config.commandAliases) command = this.config.commandAliases[command];

    callback();
}

// Initialize and load the bot
bot.load = function(configDir) {
    this.lastLoadTime = Date.now();
    this.configDir = configDir;
    this.configFile = path.join(configDir, "config.json");
    this.config = {};

    this.loadConfig(() => {
        bot.log.info("Connecting...");
        this.client.login(this.config.discordToken);
    });
}

// Called when client logs in
bot.client.on("ready", () => {
    bot.log.info(`Logged in as: ${bot.client.user.username} (id: ${bot.client.user.id})`);
    bot.client.user.setActivity(bot.config.defaultGame);
});

// Message dispatching
bot.client.on("message", async msg => {
    if (!msg.author.bot) { // Prevent infinite loops
        var executed = false;
        if (msg.content.indexOf(bot.prefixForMessageContext(msg)) === 0) { // Check if command
            const args = msg.content.slice(bot.prefixForMessageContext(msg).length).trim().split(/ +/g);
            const command = args.shift().toLowerCase();
            bot.log.debug(`Detected command ${command} with args ${args.join(" ")}`);

            bot.getCommandNamed(command, cmd => {
                if (cmd) {

                    executed = true;
                }
            });
        }
        if (!executed) {
            // run listeners
        }
    }
});

// Run the bot automatically if module is run instead of imported
if (!module.parent) {
    bot.log.info("Liora is running in standalone mode");
    const options = commandLineArgs([{ name: "configDir", defaultValue: "" }]);
    if (options.configDir == "") bot.load(path.join(os.homedir(), ".liora-bot"));
    else bot.load(options.configDir);
}

module.exports = bot;
