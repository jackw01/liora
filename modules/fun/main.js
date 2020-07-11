// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).

const discord = require('discord.js');
const commandExists = require('command-exists');
const cp = require('child_process');

const numberEmojis = {
  0: ':zero: ',
  1: ':one: ',
  2: ':two: ',
  3: ':three: ',
  4: ':four: ',
  5: ':five: ',
  6: ':six: ',
  7: ':seven: ',
  8: ':eight: ',
  9: ':nine: ',
};
const numbers = Object.keys(numberEmojis);

const magic8Ball = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes - definitely.', 'You may rely on it.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.', 'Reply hazy, try again',
  'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  'Don\'t count on it.', 'My reply is no.', 'My sources say no', 'Outlook not so good.', 'Very doubtful.',
];

const fortuneFiles = [
  'all', 'computers', 'cookie', 'definitions', 'miscellaneous', 'people', 'platitudes', 'politics',
  'science', 'wisdom',
];

// Inclusive random integer in range
function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.init = async function init(bot) {
  if (!commandExists.sync('fortune')) {
    bot.log.modinfo('Fun: fortune command disabled - make sure that fortune is installed and in path.');
    module.exports.commands = module.exports.commands.filter(c => c.name !== 'fortune');
  }
};

module.exports.commands = [
  {
    name: 'bigtext',
    description: 'Generate large text with regional indicators.',
    argumentNames: ['<text>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg) {
      const inText = args.join(' ').toLowerCase().split('');
      let output = '';
      inText.forEach((char) => {
        if (char === ' ') output += '    ';
        else if (numbers.includes(char)) output += numberEmojis[char];
        else if (/[a-z]/.test(char)) output += `:regional_indicator_${char}: `;
        else output += char;
      });
      msg.channel.send(output);
    },
  },
  {
    name: 'dice',
    description: 'Roll dice. If no arguments are given, will default to 1 d6.',
    argumentNames: ['<rolls>?', '<sides>?'],
    permissionLevel: 'all',
    aliases: ['roll'],
    async execute(args, msg, bot) {
      let rolls;
      let sides;
      if (args.length === 0) {
        rolls = 1;
        sides = 6;
      } else if (args.length === 1) {
        bot.sendError(msg.channel, 'Please specify either zero or two arguments. See help for more info.');
        return;
      } else {
        [rolls, sides] = args;
      }
      const out = [];
      for (let i = 0; i < rolls; i++) out.push(randomIntInRange(1, sides));
      const embed = new discord.MessageEmbed()
        .setTitle('Dice Roll Result')
        .setColor(bot.config.defaultColors.success)
        .addField(`${rolls}d${sides}`, out.join(', '));
      msg.channel.send({ embed });
    },
  },
  {
    name: '8ball',
    description: 'Magic 8 ball.',
    argumentNames: ['<question>?'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      const embed = new discord.MessageEmbed()
        .setTitle(`🎱 ${args.join(' ')}`)
        .setColor(bot.config.defaultColors.success)
        .setDescription(`${magic8Ball[randomIntInRange(0, magic8Ball.length - 1)]}`);
      msg.channel.send({ embed });
    },
  },
  {
    name: 'fortune',
    description: 'Get a fortune.',
    argumentNames: [`[${fortuneFiles.join('|')}]?`],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      const file = args.length === 0 ? 'wisdom' : args[0];
      if (fortuneFiles.includes(file)) {
        cp.exec(`fortune -s ${file}`, (err, stdout, stderr) => {
          if (err) {
            bot.sendError(msg.channel, 'Error running fortune');
            bot.log.modwarn(`Fun: error running fortune command: ${err}, ${stderr}`);
          } else {
            const embed = new discord.MessageEmbed()
              .setTitle('Fortune')
              .setColor(bot.config.defaultColors.success)
              .setDescription(stdout);
            msg.channel.send({ embed });
          }
        });
      } else {
        bot.sendError(msg.channel, 'Fortune file not valid.', `Choose from \`${fortuneFiles.join('`, `')}\``);
      }
    },
  },
];
