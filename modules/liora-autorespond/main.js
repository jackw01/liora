const discord = require("discord.js");
const _ = require("lodash");

module.exports.init = async function(bot) {
    if (!_.has(bot.config, "modules.autorespond.global")) _.set(bot.config, "modules.autorespond.global", {});

    const servers = bot.client.guilds.array();
    servers.forEach(server => {
        if (!_.has(bot.config, `modules.autorespond.servers[${server.id}]`))
            _.set(bot.config, `modules.autorespond.servers[${server.id}]`, {});
    });
}

module.exports.commands = [
    {
        name: "addresponse",
        description: "Add a regular expression and response to the autoresponder list. If multiple responses are added for one regex, one will be randomly selected. Use in a direct message with the bot to create a global response.",
        argumentNames: ["<regex>", "<response>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            let responsePath;
            if (msg.guild) responsePath = `modules.autorespond.servers[${msg.guild.id}]["${args[0]}"]`;
            else responsePath = `modules.autorespond.global["${args[0]}"]`;

            if (!_.has(bot.config, responsePath)) _.set(bot.config, responsePath, []);
            let value = _.get(bot.config, responsePath);
            value.push(args.splice(1).join(" "));
            _.set(bot.config, responsePath, value);
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "removeresponse",
        description: "Remove a response. Use in a direct message with the bot to remove a global response.",
        argumentNames: ["<regex>", "<index>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            let responsePath;
            if (msg.guild) responsePath = `modules.autorespond.servers[${msg.guild.id}].${args[0]}`;
            else responsePath = `modules.autorespond.global.${args[0]}`;

            if (!_.has(bot.config, responsePath + `[${args[1]}]`)) {
                msg.channel.send("❌ Response not found.");
            } else {
                let value = _.get(bot.config, responsePath);
                value.splice(args[1], 1);
                _.set(bot.config, responsePath, value);
                bot.saveConfigAndAck(msg);
            }
        }
    },
    {
        name: "listresponses",
        description: "List responses. Use in a direct message with the bot to list global responses.",
        argumentNames: [],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                msg.channel.send(JSON.stringify(bot.config.modules.autorespond.servers[msg.guild.id], null, "    "));
            } else {
                msg.channel.send(JSON.stringify(bot.config.modules.autorespond.global, null, "    "));
            }
        }
    }
]

module.exports.middleware = [
    (c, next) => {
        let responses;
        if (c.message.guild) responses = Object.assign(Object.assign({}, c.bot.config.modules.autorespond.global),
                                                       c.bot.config.modules.autorespond.servers[c.message.guild.id]);
        else responses = c.bot.config.modules.autorespond.global;

        const regexes = Object.keys(responses);
        regexes.forEach(regex => {
            if (new RegExp(regex, "g").test(c.message.content)) {
                c.message.channel.send(_.sample(responses[regex]));
                return;
            }
        });
        next();
    }
]
