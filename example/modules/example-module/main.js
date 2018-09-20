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
      await test();
      const embed = new discord.RichEmbed()
        .setTitle('Test command')
        .setAuthor('jackw01', 'https://avatars3.githubusercontent.com/u/22643669?s=460&v=4')
        .setColor(bot.config.defaultColors.success)
        .setDescription('description')
        .setURL('https://github.com/jackw01/liora')
        .addField('Field 1', 'Field 1 contents')
        .addField('Field 2', 'Field 2 contents')
        .setThumbnail('https://raw.githubusercontent.com/jackw01/liora/master/graphics/liora-icon-01.png')
        .setImage('https://raw.githubusercontent.com/jackw01/liora/master/graphics/liora-logo-01.png')
        .setFooter('Footer')
        .setTimestamp();
      msg.channel.send({ embed });
    },
  },
];
