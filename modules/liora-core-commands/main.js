const discord = require("discord.js");
const _ = require("lodash");
const prettyMs = require("pretty-ms");

// Module init function - called after bot is connected and in servers
// Use for initializing per-server module state information or similar things
module.exports.init = async function(bot) {
}

// Module commands object - all commands should be defined here
//
// Format:
// commandname is how the users will run a command and MUST be all lowercase
// "commandname": {
//     // Description of the command (not arguments) that will be displayed in the help text
//     description: "description",
//     // Array of argument names: follow the provided format
//     argumentNames: ["<requiredArgument>", "<optionalArgument>?"],
//     // Permission level: "all" for all users, "owner" for owner, "manager" or anything else for a group
//     permissionLevel: "all",
//     // Function that performs the command: must accept three arguments
//     //   args: array of arguments that the user executed the command with
//     //   msg: Discord.js message object that the command was found in
//     //   bot: the Liora instance calling this function
//     execute: async function(args, msg, bot) {
//         // Do the command here
//     }
// },
module.exports.commands = {

    "help": {
        description: "Get help and info on the bot.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            const embed = new discord.RichEmbed()
                .setTitle("Liora v1.0.0")
                .setDescription(`Use \`${bot.prefixForMessageContext(msg)}list\` to list commands.\nLiora is built with ❤️ by jackw01 and released under the MIT license.\n[https://github.com/jackw01/liora](https://github.com/jackw01/liora)`)
                .setColor(bot.config.defaultColors.neutral)
                .addField("Bot ID", bot.client.user.id, true)
                .addField("Owner ID", bot.config.owner, true)
                .addField("Channels", bot.client.channels.array().length, true)
                .addField("Client Uptime", prettyMs(bot.client.uptime), true)
                .addField("Bot Uptime", prettyMs(Date.now() - bot.firstLoadTime), true)
                .addField("Last Startup Time", prettyMs(bot.lastLoadDuration), true);
            msg.channel.send({embed});
        }
    },

    "own": {
        description: "Become the bot owner. This command can only be used once.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            bot.config.owner = bot.config.owner || msg.author.id;
            saveConfigAndAck(msg, bot);
        }
    },

    "permadd": {
        description: "Add a user by ID to a permission group.",
        argumentNames: ["<userID> <group>"],
        permissionLevel: "owner",
        execute: async function(args, msg, bot) {
            if (!bot.config.groups[args[1]]) bot.config.groups[args[1]] = [];
            if (!bot.config.groups[args[1]].includes(args[0])) bot.config.groups[args[1]].push(args[0]);
            saveConfigAndAck(msg, bot);
        }
    },

    "permremove": {
        description: "Remove a user by ID from a permission group.",
        argumentNames: ["<userID> <group>"],
        permissionLevel: "owner",
        execute: async function(args, msg, bot) {
            if (bot.config.groups[args[1]]) {
                _.remove(bot.config.groups[args[1]], i => {return i == args[0]});
                saveConfigAndAck(msg, bot);
            } else {
                msg.channel.send("❌ Group does not exist.");
            }
        }
    },

    "permgroups": {
        description: "List permission groups",
        argumentNames: [],
        permissionLevel: "owner",
        execute: async function(args, msg, bot) {
            const groups = Object.keys(bot.config.groups);
            if (groups.length > 0) msg.channel.send(`Groups: \`${groups.join("\`, \`")}\``);
            else msg.channel.send("❌ No groups configured.");
        }
    },

    "permlist": {
        description: "List users in a permission group.",
        argumentNames: ["<group>"],
        permissionLevel: "owner",
        execute: async function(args, msg, bot) {
            const group = bot.config.groups[args[0]] || [];
            if (group.length > 0) msg.channel.send(`Users: \`${group.join("\`, \`")}\``);
            else msg.channel.send("❌ Group does not exist or is empty.");
        }
    },

    "ping": {
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            const m = await msg.channel.send("pong");
            msg.channel.send(`ℹ️ Socket heartbeat ping is ${Math.round(bot.client.ping)}ms. Message RTT is ${m.createdTimestamp - msg.createdTimestamp}ms.`);
            m.delete();
        }
    }
}

function saveConfigAndAck(msg, bot) {
    bot.saveConfig(err => {
        if (err) msg.channel.send(`❌ Error saving config file: ${err.message}`);
        else msg.react("✅");
    });
}
