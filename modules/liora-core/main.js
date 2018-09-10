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
// {
//     // Name of the command (what users will type to run it) - must be lowercase
//     name: "command",
//     // Description of the command (not arguments) that will be displayed in the help text
//     description: "description",
//     // Array of argument names: follow the provided format
//     argumentNames: ["<requiredArgument>", "<optionalArgument>?"],
//     // Permission level: "all" for all users, "owner" for owner, "manager" or anything else for a group
//     permissionLevel: "all",
//     // Array of default aliases (alternate ways of running this command)
//     aliases: ["alternate1", "alternate2"],
//     // Function that performs the command: must accept three arguments
//     //   args: array of arguments that the user executed the command with
//     //   msg: Discord.js message object that the command was found in
//     //   bot: the Liora instance calling this function
//     execute: async function(args, msg, bot) {
//         // Do the command here
//     }
// },
module.exports.commands = [
    {
        name: "info",
        description: "Get info on the bot.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
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
    {
        name: "help",
        description: "Get help on a command.",
        argumentNames: ["<commandName>?"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length == 0) {
                msg.channel.send(`Use \`${bot.prefixForMessageContext(msg)}help <command>\` to view help for a command. Use \`${bot.prefixForMessageContext(msg)}list\` to list commands.`);
            } else {
                bot.getCommandNamed(args[0], cmd => {
                    if (cmd) {
                        let aliases = "";
                        cmd.aliases.forEach(a => { aliases += `\`${a}\` ` });
                        const customAliases = Object.keys(bot.config.commandAliases);
                        customAliases.forEach(a => {
                            if (bot.config.commandAliases[a] == cmd.name) aliases += `\`${a}\` `;
                        });
                        const embed = new discord.RichEmbed()
                            .setTitle(`Command Help: \`${cmd.name}\``)
                            .setColor(bot.config.defaultColors.neutral)
                            .setDescription(`Aliases: ${aliases}`)
                            .addField(`\`${bot.prefixForMessageContext(msg)}${cmd.name} ${cmd.argumentNames.join(" ")}\``, cmd.description);
                        msg.channel.send({embed});
                    } else msg.channel.send(`❌ Command \`${args[0]}\` not found.`);
                });
            }
        }
    },
    {
        name: "list",
        description: "List commands.",
        argumentNames: ["<module>?"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length == 0) {
                const embed = new discord.RichEmbed()
                    .setTitle("Active modules:")
                    .setColor(bot.config.defaultColors.neutral)
                    .setDescription(`Use \`${bot.prefixForMessageContext(msg)}list <module>\` to view command usage and description for a module.`);
                const modules = Object.getOwnPropertyNames(bot.modules);
                modules.forEach(mod => {
                    const arr = bot.modules[mod].commands.map(cmd => cmd.name);
                    embed.addField(`\`${mod}\``, `\`${arr.join("\`, \`")}\``);
                });
                msg.channel.send({embed});
            } else {
                if (Object.getOwnPropertyNames(bot.modules).indexOf(args[0]) != -1) {
                    let embed = new discord.RichEmbed()
                        .setTitle(`Commands in module \`${args[0]}\``)
                        .setColor(bot.config.defaultColors.neutral);
                    const modules = _.chunk(bot.modules[args[0]].commands, 25);
                    modules.forEach(chunk => {
                        chunk.forEach(cmd => {
                            embed.addField(`\`${bot.prefixForMessageContext(msg)}${cmd.name} ${cmd.argumentNames.join(" ")}\``, cmd.description);
                        });
                        msg.channel.send({embed});
                        embed = new discord.RichEmbed()
                            .setColor(bot.config.defaultColors.neutral);
                    })
                } else msg.channel.send(`❌ Module \`${args[0]}\` not found.`);
            }
        }
    },
    {
        name: "own",
        description: "Become the bot owner. This command can only be used once.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            bot.config.owner = bot.config.owner || msg.author.id;
            bot.bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "getconfig",
        description: "Get a configuration item.",
        argumentNames: ["<itemPath>"],
        permissionLevel: "owner",
        aliases: ["cget"],
        execute: async function(args, msg, bot) {
            msg.channel.send(`ℹ️ Value for key ${args[0]}: ${_.get(bot.config, args[0], "undefined")}`);
        }
    },
    {
        name: "setconfig",
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
                bot.saveConfigAndAck(msg);
                if (args[0] == "defaultGame") bot.client.user.setActivity(bot.config.defaultGame);
            }
        }
    },
    {
        name: "kill",
        description: "Shutdown the bot.",
        argumentNames: [],
        permissionLevel: "owner",
        aliases: ["shutdown"],
        execute: async function(args, msg, bot) {
            msg.react("✅");
            bot.shutdown();
        }
    },
    {
        name: "restart",
        description: "Completely restart the bot.",
        argumentNames: [],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            msg.react("🔄");
            bot.restart();
        }
    },
    {
        name: "reload",
        description: "Reload all modules.",
        argumentNames: [],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            var moduleCount = 0;
            var startTime = Date.now();
            for (let i = 0; i < bot.config.activeModules.length; i++) {
                const module = bot.config.activeModules[i];
                bot.unloadModule(module, err => {
                    if (err) msg.channel.send(`❌ Error unloading \`${module}\`: ${err.message}`);
                    bot.loadModule(bot.config.activeModules[i], err => {
                        if (err) {
                            msg.channel.send(`❌ Error loading \`${module}\`: ${err.message}`);
                        } else {
                            bot.initModule(module, err => {
                                if (err) {
                                    msg.channel.send(`❌ Error initializing \`${module}\`: ${err.message}`);
                                } else if (++moduleCount >= bot.config.activeModules.length) {
                                    msg.channel.send(`✅ Reloaded all modules in ${prettyMs(Date.now() - startTime)}`);
                                }
                            });
                        }
                    });
                });
            }
        }
    },
    {
        name: "loadmodule",
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
    {
        name: "reloadmodule",
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
    {
        name: "unloadmodule",
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
    {
        name: "permadd",
        description: "Add a user (mention or name) to a permission group.",
        argumentNames: ["<user> <group>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length <= 2) {
                let id;
                if (msg.guild) {
                    var result = bot.util.parseUsername(args[0], msg.guild);
                    if (result) {
                        if (result.length == 1) id = result[0].id;
                        else msg.channel.send(`❌ Multiple users matching user string found. Please @mention or be more specific.`);
                    }
                    else msg.channel.send(`❌ User not found.`);
                } else {
                    if (bot.util.isSnowflake(args[0])) id = args[0];
                    else msg.channel.send(`❌ User string does not appear to be a valid user id.`);
                }
                if (id) {
                    if (!bot.config.groups[args[1]]) bot.config.groups[args[1]] = [];
                    if (!bot.config.groups[args[1]].includes(id)) bot.config.groups[args[1]].push(id);
                    bot.saveConfigAndAck(msg);
                }
            } else msg.channel.send(`❌ Spaces are not allowed in userstrings or group names.`);
        }
    },
    {
        name: "permremove",
        description: "Remove a user (mention or name) from a permission group.",
        argumentNames: ["<user> <group>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length <= 2) {
                let id;
                if (msg.guild) {
                    var result = bot.util.parseUsername(args[0], msg.guild);
                    if (result) {
                        if (result.length == 1) id = result[0].id;
                        else msg.channel.send(`❌ Multiple users matching user string found. Please @mention or be more specific.`);
                    }
                    else msg.channel.send(`❌ User not found.`);
                } else {
                    if (bot.util.isSnowflake(args[0])) id = args[0];
                    else msg.channel.send(`❌ User string does not appear to be a valid user id.`);
                }
                if (id) {
                    if (bot.config.groups[args[1]]) {
                        _.remove(bot.config.groups[args[1]], i => {return i == id});
                        bot.saveConfigAndAck(msg);
                    } else {
                        msg.channel.send("❌ Group does not exist.");
                    }
                }
            } else msg.channel.send(`❌ Spaces are not allowed in userstrings or group names.`);
        }
    },
    {
        name: "permgroups",
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
    {
        name: "permlist",
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
    {
        name: "addgroupoverride",
        description: "Add a group override for a command.",
        argumentNames: ["<command> <group>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            bot.config.commandPermissions[args[0]] = args[1];
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "removegroupoverride",
        description: "Remove a group override for a command.",
        argumentNames: ["<command>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            delete bot.config.commandPermissions[args[0]];
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "addroleoverride",
        description: "Add a role (mention or name) override for a command.",
        argumentNames: ["<command> <role>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (args.length <= 2) {
                let id;
                if (msg.guild) {
                    var result = bot.util.parseRole(args[1], msg.guild);
                    if (result) {
                        if (result.length == 1) id = result[0].id;
                        else msg.channel.send(`❌ Multiple roles matching role string found. Please @mention or be more specific.`);
                    }
                    else msg.channel.send(`❌ Role not found.`);
                } else {
                    if (bot.util.isSnowflake(args[1])) id = args[1];
                    else msg.channel.send(`❌ Role string does not appear to be a valid role id.`);
                }
                if (id) {
                    bot.config.serverPermissions[msg.guild.id][args[0]] = id;
                    bot.saveConfigAndAck(msg);
                }
            } else msg.channel.send(`❌ Spaces are not allowed in rolestrings or command names.`);
        }
    },
    {
        name: "removeroleoverride",
        description: "Remove a role override for a command.",
        argumentNames: ["<command>"],
        permissionLevel: "owner",
        aliases: [],
        execute: async function(args, msg, bot) {
            delete bot.config.serverPermissions[msg.guild.id][args[0]];
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "listoverrides",
        description: "List overrides.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const embed = new discord.RichEmbed()
                .setTitle("Overrides")
                .setColor(bot.config.defaultColors.neutral);
            embed.addField("Group overrides", `\`${JSON.stringify(bot.config.commandPermissions, null, 4)}\``);
            embed.addField("Role overrides", `\`${JSON.stringify(bot.config.serverPermissions, null, 4)}\``);
            msg.channel.send({embed});
        }
    },
    {
        name: "serverinfo",
        description: "Get info for the current server.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                const roles = msg.guild.roles.array();
                const embed = new discord.RichEmbed()
                    .setTitle(`Server info for ${msg.guild.name}`)
                    .setColor(bot.config.defaultColors.neutral)
                    .setThumbnail(msg.guild.iconURL)
                    .addField("ID", `\`${msg.guild.id}\``, true)
                    .addField("Owner", bot.util.username(msg.guild.owner.user), true)
                    .addField("Channels", msg.guild.channels.array().length, true)
                    .addField("Verified", msg.guild.verified, true)
                    .addField("Custom Emojis", `${msg.guild.emojis.array().length}`, true)
                    .addField("Roles", `${roles.length}: ${roles.map(r => r.name).join(", ")}`)
                    .addField("Joined", msg.guild.joinedAt)
                    .addField("Created", msg.guild.createdAt);
                msg.channel.send({embed});
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "servericon",
        description: "Get the icon for the current server.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                const embed = new discord.RichEmbed()
                    .setTitle(`Server icon for ${msg.guild.name}`)
                    .setColor(bot.config.defaultColors.success)
                    .setImage(msg.guild.iconURL)
                    .setURL(msg.guild.iconURL);
                msg.channel.send({embed});
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "userinfo",
        description: "Get info for a user mention, username, or nickname.",
        argumentNames: ["<user>"],
        permissionLevel: "all",
        aliases: ["userid"],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                var result = bot.util.parseUsername(args.join(" "), msg.guild);
                if (result) {
                    const user = result[0];
                    const member = msg.guild.members.get(user.id);
                    const embed = new discord.RichEmbed()
                        .setTitle(`User info for ${bot.util.username(user)}`)
                        .setColor(bot.config.defaultColors.success)
                        .setThumbnail(user.avatarURL)
                        .addField("ID", `\`${user.id}\``, true)
                        .addField("Nickname", member.nickname || "None", true)
                        .addField("Status", user.presence.status, true)
                        .addField("Playing", user.presence.game || "N/A", true)
                        .addField("Roles", member.roles.map(r => r.name).join(", "))
                        .addField("Joined", member.joinedAt)
                        .addField("Created", user.createdAt);
                    msg.channel.send({embed});
                } else msg.channel.send(`❌ User not found.`);
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "profilepic",
        description: "Get a profile picture for a user mention, username, or nickname.",
        argumentNames: ["<user>"],
        permissionLevel: "all",
        aliases: ["avatar", "pfp"],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                var result = bot.util.parseUsername(args.join(" "), msg.guild);
                if (result) {
                    const user = result[0];
                    const embed = new discord.RichEmbed()
                        .setTitle(`Profile picture for ${bot.util.username(user)}`)
                        .setColor(bot.config.defaultColors.success)
                        .setImage(user.avatarURL)
                        .setURL(user.avatarURL);
                    msg.channel.send({embed});
                } else msg.channel.send(`❌ User not found.`);
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "roleinfo",
        description: "Get the ID for a role mention or name",
        argumentNames: ["<role>"],
        permissionLevel: "all",
        aliases: ["roleid"],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                var result = bot.util.parseRole(args.join(" "), msg.guild);
                if (result) {
                    const role = result[0];
                    const members = role.members.array();
                    let membersString;
                    if (members.length > 25) membersString = `${members.length} users in this role.`;
                    else membersString = members.map(m => bot.util.username(m.user)).join(", ");
                    const embed = new discord.RichEmbed()
                        .setTitle(`Role info for ${role.name}`)
                        .setColor(bot.config.defaultColors.success)
                        .addField("ID", `\`${role.id}\``, true)
                        .addField("Color", `\`${role.hexColor}\``, true)
                        .addField("Position", role.calculatedPosition, true)
                        .addField("Mentionable", role.mentionable, true)
                        .addField("Hoisted", role.hoist, true)
                        .addField("Managed", role.managed, true)
                        .addField("Members", membersString)
                        .addField("Created", role.createdAt);
                    msg.channel.send({embed});
                } else msg.channel.send(`❌ Role not found.`);
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "channelinfo",
        description: "Get the ID for a channel mention or name",
        argumentNames: ["<channel>"],
        permissionLevel: "all",
        aliases: ["channelid"],
        execute: async function(args, msg, bot) {
            if (msg.guild) {
                var result = bot.util.parseChannel(args.join(" "), msg.guild);
                if (result) {
                    const channel = result[0];
                    const embed = new discord.RichEmbed()
                        .setTitle(`Channel info for ${channel.name}`)
                        .setColor(bot.config.defaultColors.success)
                        .addField("ID", `\`${channel.id}\``, true)
                        .addField("Type", channel.type, true)
                        .addField("Created", channel.createdAt);
                    msg.channel.send({embed});
                } else msg.channel.send(`❌ Channel not found.`);
            } else msg.channel.send(`❌ Must be in a server to use this command.`);
        }
    },
    {
        name: "setnick",
        description: "Set nickname.",
        argumentNames: ["<newNickname>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            msg.guild.members.get(bot.client.user.id).setNickname(args.join(" "));
            msg.react("✅");
        }
    },
    {
        name: "ping",
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
    {
        name: "alias",
        description: "Define an alias for a command.",
        argumentNames: ["<alias>", "<command>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            bot.config.commandAliases[args[0]] = args[1];
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "removealias",
        description: "Remove an alias for a command.",
        argumentNames: ["<alias>"],
        permissionLevel: "manager",
        aliases: [],
        execute: async function(args, msg, bot) {
            delete bot.config.commandAliases[args[0]];
            bot.saveConfigAndAck(msg);
        }
    },
    {
        name: "aliases",
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
]
