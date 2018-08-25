const os = require("os");
const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const commandLineArgs = require("command-line-args");
const jsonfile = require("jsonfile");
const discord = require("discord.js");

const options = commandLineArgs([{ name: "configDir", defaultValue: "" }]);

var configDir;
if (options.configDir == "") configDir = path.join(os.homedir(), ".liora-bot");
else configDir = options.configDir;

// Constants
const configFile = path.join(configDir, "config.json");

// Bot
const bot = {configDir: configDir, client: new discord.Client()};

// Config management
bot.saveConfig = function(callback) {
    jsonfile.writeFile(configFile, bot.config, {spaces: 4, EOL: "\n"}, (err) => {
        if (err) {
            callback(err);
        } else {
            callback();
        }
    });
}

bot.loadConfig = function(callback) {

    if (!fs.existsSync(configFile)) {
        try {
            mkdirp.sync(path.dirname(configFile));
            fs.writeFileSync(configFile, JSON.stringify({}, null, 4));
        } catch (err) {
            throw err;
        }
    }

    try {
        bot.config = JSON.parse(fs.readFileSync(configFile));
    } catch (err) {
        bot.config = {};
    }

    callback();
}

bot.load = function() {
    this.lastLoadTime = Date.now();
    this.config = {};

    this.loadConfig(() => {
        this.client.login(this.config.discordToken);
    });
}

bot.client.on("ready", () => {
    console.log("ready");
});

module.exports = bot;
