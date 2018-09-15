// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).
// Example module

module.exports.init = async function init(bot) {
};

module.exports.commands = [

  {
    name: 'potato',
    description: 'Ping.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      msg.channel.send('potato.');
    },
  },
];
