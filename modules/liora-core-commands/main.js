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
        aliases: ["info"],
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

    "list": {
        description: "List commands.",
        argumentNames: ["<module>?"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length == 0) {
                const embed = new discord.RichEmbed()
                    .setTitle("Active modules:")
                    .setColor(bot.config.defaultColors.neutral);
                const modules = Object.getOwnPropertyNames(bot.modules);
                modules.forEach(mod => {
                    const arr = Object.getOwnPropertyNames(bot.modules[mod].commands);
                    embed.addField(`\`${mod}\``, `\`${arr.join("\`, \`")}\``);
                });
                msg.channel.send({embed});
            } else {
                if (Object.getOwnPropertyNames(bot.modules).indexOf(args[0]) != -1) {
                    const arr = Object.getOwnPropertyNames(bot.modules[args[0]].commands);
                    const embed = new discord.RichEmbed()
                        .setTitle(`Commands in module \`${args[0]}\``)
                        .setColor(bot.config.defaultColors.neutral);
                    arr.forEach(name => {
                        const cmd = bot.modules[args[0]].commands[name];
                        embed.addField(`\`${bot.prefixForMessageContext(msg)}${name} ${cmd.argumentNames.join(" ")}\``, cmd.description);
                    })
                    msg.channel.send({embed});
                } else {
                    msg.channel.send(`❌ Module \`${args[0]}\` not found.`);
                }
            }
        }
    },

    "own": {
        description: "Become the bot owner. This command can only be used once.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            bot.config.owner = bot.config.owner || msg.author.id;
            saveConfigAndAck(msg, bot);
        }
    },

    "getconfig": {
        description: "Get a configuration item.",
        argumentNames: ["<itemPath>"],
        permissionLevel: "owner",
        aliases: ["cget"],
        execute: async function(args, msg, bot) {
            msg.channel.send(`ℹ️ Value for key ${args[0]}: ${_.get(bot.config, args[0], "undefined")}`);
        }
    },

    "setconfig": {
        description: "Set a configuration item.",
        argumentNames: ["<itemPath>", "<value>"],
        permissionLevel: "owner",
        aliases: ["cset"],
        execute: async function(args, msg, bot) {
            // Cannot change permissions using this command
            if (args[0] == "owner" || args[0].includes("groups") || args[0].includes("Permissions")) {
                msg.channel.send("❌ This configuration item cannot be edited.");
            } else {
                _.set(bot.config, args[0], args.splice(1).join(" "));
                saveConfigAndAck(msg, bot);
                if (args[0] == "defaultGame") bot.client.user.setActivity(bot.config.defaultGame);
            }
        }
    },

    "loadmodule": {
        description: "Load a module.",
        argumentNames: ["<moduleName>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            var startTime = Date.now();
            bot.loadModule(args.join(""), err => {
                if (err) {
                    msg.channel.send(`❌ Error: ${err.message}`);
                } else {
                    bot.initModule(args.join(""), err => {
                        if (err) {
                            msg.channel.send(`❌ Error initializing \`${args.join("")}\`: ${err.message}`);
                        } else {
                            let value = _.get(bot.config, "activeModules");
                            if (value.indexOf(args.join("")) == -1) {
                                value.push(args.join(""))
                                _.set(bot.config, "activeModules", value);
                                bot.saveConfig(err => {
                                    if (err) msg.channel.send(`❌ Error saving config file: ${err.message}`);
                                    else msg.channel.send(`✅ Module loaded in ${prettyMs(Date.now() - startTime)}`);
                                });
                            }
                        }
                    });
                }
            });
        }
    },

    "reloadmodule": {
        description: "Reload a module.",
        argumentNames: ["<moduleName>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            var startTime = Date.now();
            bot.unloadModule(args.join(""), err => {
                if (err) {
                    msg.channel.send(`❌ Error: ${err.message}`);
                } else {
                    bot.loadModule(args.join(""), err => {
                        if (err) {
                            msg.channel.send(`❌ Error: ${err.message}`);
                        } else {
                            bot.modules[args.join("")].init(bot);
                            bot.initModule(args.join(""), err => {
                                if (err) {
                                    msg.channel.send(`❌ Error initializing \`${args.join("")}\`: ${err.message}`);
                                } else {
                                    msg.channel.send(`✅ Module reloaded in ${prettyMs(Date.now() - startTime)}`);
                                }
                            });
                        }
                    });
                }
            });
        }
    },

    "unloadmodule": {
        description: "Unload a module.",
        argumentNames: ["<moduleName>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            var startTime = Date.now();
            bot.unloadModule(args.join(""), err => {
                if (err) {
                    msg.channel.send(`❌ Error: ${err.message}`);
                } else {
                    let value = _.get(bot.config, "activeModules");
                    if (value.indexOf(args.join("")) != -1) {
                        value.splice(value.indexOf(args.join("")), 1);
                        _.set(bot.config, "activeModules", value);
                        bot.saveConfig(err => {
                            if (err) msg.channel.send(`❌ Error saving config file: ${err.message}`);
                            else msg.channel.send(`✅ Module unloaded in ${prettyMs(Date.now() - startTime)}`);
                        });
                    }
                }
            });
        }
    },

    "permadd": {
        description: "Add a user by ID to a permission group.",
        argumentNames: ["<userID> <group>"],
        permissionLevel: "owner",
        aliases: [],
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
        aliases: [],
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
        aliases: [],
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
        aliases: [],
        execute: async function(args, msg, bot) {
            const group = bot.config.groups[args[0]] || [];
            if (group.length > 0) msg.channel.send(`Users: \`${group.join("\`, \`")}\``);
            else msg.channel.send("❌ Group does not exist or is empty.");
        }
    },

    "roleid": {
        description: "Get the ID for a role.",
        argumentNames: ["<role>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                var result = msg.guild.roles.find(r => {
                    return r.name.toLowerCase() === args.join(" ").toLowerCase()
                });
                if (result) msg.channel.send(`✅ Role id: \`${result.id}\`.`);
                else msg.channel.send(`❌ Role not found.`);
            } else {
                msg.channel.send(`❌ Must be in a server to use this command.`);
            }
        }
    },

    "setnick": {
        description: "Set nickname.",
        argumentNames: ["<newNickname>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            msg.guild.members.get(bot.client.user.id).setNickname(args.join(" "));
        }
    },

    "ping": {
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const m = await msg.channel.send("pong");
            msg.channel.send(`ℹ️ Socket heartbeat ping is ${Math.round(bot.client.ping)}ms. Message RTT is ${m.createdTimestamp - msg.createdTimestamp}ms.`);
            m.delete();
        }
    },

    "alias": {
        description: "Define an alias for a command.",
        argumentNames: ["<alias>", "<command>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            bot.config.commandAliases[args[0]] = args[1];
            saveConfigAndAck(msg, bot);
        }
    },

    "removealias": {
        description: "Remove an alias for a command.",
        argumentNames: ["<alias>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            delete bot.config.commandAliases[args[0]];
            saveConfigAndAck(msg, bot);
        }
    },

    "aliases": {
        description: "List aliases.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const embed = new discord.RichEmbed()
                .setTitle("Aliases")
                .setColor(bot.config.defaultColors.neutral);
            let text = "";
            const aliases = Object.keys(bot.config.commandAliases);
            aliases.forEach(alias => {
                text += `**\`${alias}\`**: \`${bot.config.commandAliases[alias]}\`\n`;
            });
            const moduleNames = Object.keys(bot.modules);
            moduleNames.forEach(name => {
                const aliases = Object.keys(bot.modules[name].defaultAliases);
                aliases.forEach(alias => {
                    text += `**\`${alias}\`**: \`${bot.modules[name].defaultAliases[alias]}\`\n`;
                });
            });
            embed.setDescription(text);
            msg.channel.send({embed});
        }
    }
}

function saveConfigAndAck(msg, bot) {
    bot.saveConfig(err => {
        if (err) msg.channel.send(`❌ Error saving config file: ${err.message}`);
        else msg.react("✅");
    });
}
