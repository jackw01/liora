const _ = require("lodash");

module.exports.init = async function(bot) {
}

module.exports.commands = {

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
