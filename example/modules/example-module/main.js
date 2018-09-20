// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).
// Example module

const discord = require('discord.js');

module.exports.commands = [
  {
    name: 'test',
    description: 'Test command.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      const embed = new discord.RichEmbed()
        .setTitle('Test command')
        .setColor(bot.config.defaultColors.success)
        .setDescription('description')
        .addField('Field 1', 'Field 1 contents')
        .addField('Field 2', 'Field 2 contents')
        .addThumbnail('https://raw.githubusercontent.com/jackw01/liora/master/graphics/liora-icon-01.png')
        .addFooter('Footer');
      msg.channel.send({ embed });
    },
  },
];
