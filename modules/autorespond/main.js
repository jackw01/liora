// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).

const discord = require('discord.js');
const _ = require('lodash');

module.exports.init = async function init(bot) {
  bot.configSetDefault('modules.autorespond.global', {});

  const servers = bot.client.guilds.array();
  servers.forEach((server) => {
    bot.configSetDefault(`modules.autorespond.servers[${server.id}]`, {});
  });
};

module.exports.commands = [
  {
    name: 'addresponse',
    description: 'Add a regular expression and response to the autoresponder list. If multiple responses are added for one regex, one will be randomly selected. Use in a direct message with the bot to create a global response.',
    argumentNames: ['<regex>', '<response>'],
    permissionLevel: 'manager',
    aliases: [],
    async execute(args, msg, bot) {
      let responsePath;
      if (msg.guild) responsePath = `modules.autorespond.servers[${msg.guild.id}]["${args[0]}"]`;
      else responsePath = `modules.autorespond.global["${args[0]}"]`;

      bot.configSetDefault(responsePath, []);
      const value = bot.configGet(responsePath);
      value.push(args.splice(1).join(' '));
      bot.configSet(responsePath, value);
    },
  },
  {
    name: 'removeresponse',
    description: 'Remove a response. Use in a direct message with the bot to remove a global response.',
    argumentNames: ['<regex>', '<index>'],
    permissionLevel: 'manager',
    aliases: [],
    async execute(args, msg, bot) {
      let responsePath;
      if (msg.guild) responsePath = `modules.autorespond.servers[${msg.guild.id}].${args[0]}`;
      else responsePath = `modules.autorespond.global.${args[0]}`;

      if (!bot.configHas(`${responsePath}[${args[1]}]`)) {
        bot.sendError(msg.channel, 'Response not found.');
      } else {
        const value = bot.configGet(responsePath);
        value.splice(args[1], 1);
        bot.configSet(responsePath, value);
      }
    },
  },
  {
    name: 'listresponses',
    description: 'List responses. Use in a direct message with the bot to list global responses.',
    argumentNames: [],
    permissionLevel: 'manager',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild) {
        msg.channel.send(JSON.stringify(bot.config.modules.autorespond.servers[msg.guild.id], null, '    '));
      } else {
        msg.channel.send(JSON.stringify(bot.config.modules.autorespond.global, null, '    '));
      }
    },
  },
];

module.exports.middleware = [
  (c, next) => {
    let responses;
    if (c.message.guild) {
      responses = Object.assign(Object.assign({}, c.bot.config.modules.autorespond.global),
        c.bot.config.modules.autorespond.servers[c.message.guild.id]);
    } else responses = c.bot.config.modules.autorespond.global;

    const regexes = Object.keys(responses);
    let continueFlag = true;
    regexes.forEach((regex) => {
      if (new RegExp(regex, 'g').test(c.message.content)) {
        c.message.channel.send(_.sample(responses[regex]));
        continueFlag = false;
      }
    });
    if (continueFlag) next();
  },
];
