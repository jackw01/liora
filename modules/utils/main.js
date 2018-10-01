// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).

const discord = require('discord.js');

const pollState = {};

function showPollData(bot, channel) {
  const embed = new discord.RichEmbed()
    .setTitle('Poll Results')
    .setColor(bot.config.defaultColors.success)
    .setDescription(`Question: ${pollState[channel.id].question}`);
  pollState[channel.id].args.forEach((option, i) => {
    const votes = pollState[channel.id].votes[i];
    embed.addField(`${i + 1}: ${option}`, `${votes} vote${votes === 1 ? '' : 's'}`);
  });
  channel.send({ embed });
}

module.exports.commands = [
  {
    name: 'serverinfo',
    description: 'Get info for the current server.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild) {
        const roles = msg.guild.roles.array();
        const embed = new discord.RichEmbed()
          .setTitle(`Server info for ${msg.guild.name}`)
          .setColor(bot.config.defaultColors.neutral)
          .setThumbnail(msg.guild.iconURL)
          .addField('ID', `\`${msg.guild.id}\``, true)
          .addField('Owner', bot.util.username(msg.guild.owner.user), true)
          .addField('Channels', msg.guild.channels.size, true)
          .addField('Verified', msg.guild.verified, true)
          .addField('Custom Emojis', `${msg.guild.emojis.size}`, true)
          .addField('Roles', `${roles.length}: ${roles.map(r => r.name).join(', ')}`)
          .addField('Joined', msg.guild.joinedAt)
          .addField('Created', msg.guild.createdAt);
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'userinfo',
    description: 'Get info for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.',
    argumentNames: ['<user>?'],
    permissionLevel: 'all',
    aliases: ['userid'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        let result;
        if (args.length) result = bot.util.parseUsername(args.join(' '), msg.guild);
        else result = [msg.author];
        if (result) {
          const user = result[0];
          const member = msg.guild.members.get(user.id);
          const embed = new discord.RichEmbed()
            .setTitle(`User info for ${bot.util.username(user)}`)
            .setColor(bot.config.defaultColors.success)
            .setThumbnail(user.avatarURL)
            .addField('ID', `\`${user.id}\``, true)
            .addField('Nickname', member.nickname || 'None', true)
            .addField('Status', user.presence.status, true)
            .addField('Playing', user.presence.game || 'N/A', true)
            .addField('Roles', member.roles.map(r => r.name).join(', '))
            .addField('Joined', member.joinedAt)
            .addField('Created', user.createdAt);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'User not found.');
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'roleinfo',
    description: 'Get the ID for a role mention or name',
    argumentNames: ['<role>'],
    permissionLevel: 'all',
    aliases: ['roleid'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        const result = bot.util.parseRole(args.join(' '), msg.guild);
        if (result) {
          const role = result[0];
          const members = role.members.array();
          let membersString;
          if (members.length > 25) membersString = `${members.length} users in this role.`;
          else membersString = members.map(m => bot.util.username(m.user)).join(', ');
          const embed = new discord.RichEmbed()
            .setTitle(`Role info for ${role.name}`)
            .setColor(bot.config.defaultColors.success)
            .addField('ID', `\`${role.id}\``, true)
            .addField('Color', `\`${role.hexColor}\``, true)
            .addField('Position', role.calculatedPosition, true)
            .addField('Mentionable', role.mentionable, true)
            .addField('Hoisted', role.hoist, true)
            .addField('Managed', role.managed, true)
            .addField('Members', membersString)
            .addField('Created', role.createdAt);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'Role not found.');
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'channelinfo',
    description: 'Get the ID for a channel mention or name',
    argumentNames: ['<channel>'],
    permissionLevel: 'all',
    aliases: ['channelid'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        const result = bot.util.parseChannel(args.join(' '), msg.guild);
        if (result) {
          const channel = result[0];
          const embed = new discord.RichEmbed()
            .setTitle(`Channel info for ${channel.name}`)
            .setColor(bot.config.defaultColors.success)
            .addField('ID', `\`${channel.id}\``, true)
            .addField('Type', channel.type, true)
            .addField('Created', channel.createdAt);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'Channel not found.');
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'servericon',
    description: 'Get the icon for the current server.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild) {
        const embed = new discord.RichEmbed()
          .setTitle(`Server icon for ${msg.guild.name}`)
          .setColor(bot.config.defaultColors.success)
          .setImage(msg.guild.iconURL)
          .setURL(msg.guild.iconURL);
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'profilepic',
    description: 'Get a profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.',
    argumentNames: ['<user>?'],
    permissionLevel: 'all',
    aliases: ['avatar', 'pfp'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        let result;
        if (args.length) result = bot.util.parseUsername(args.join(' '), msg.guild);
        else result = [msg.author];
        if (result) {
          const user = result[0];
          const embed = new discord.RichEmbed()
            .setTitle(`Profile picture for ${bot.util.username(user)}`)
            .setColor(bot.config.defaultColors.success)
            .setImage(user.avatarURL)
            .setURL(user.avatarURL);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'User not found.');
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'setnick',
    description: 'Set nickname.',
    argumentNames: ['<newNickname>'],
    permissionLevel: 'manager',
    aliases: [],
    async execute(args, msg, bot) {
      msg.guild.members.get(bot.client.user.id).setNickname(args.join(' '));
      msg.react('✅');
    },
  },
  {
    name: 'poll',
    description: 'Create a poll on the current channel.',
    argumentNames: ['"question"', '"answer-1"', '"answer-n"'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (!pollState[msg.channel.id]) {
        if (args.length < 25) {
          pollState[msg.channel.id] = {
            question: args[0], args: [], votes: [], users: new Set(),
          };
          const embed = new discord.RichEmbed()
            .setTitle(args[0])
            .setColor(bot.config.defaultColors.success)
            .setDescription(`Use \`${bot.prefixForMessageContext(msg)}vote <choiceNumber>\` to vote.`);
          for (let i = 1; i < args.length; i++) {
            pollState[msg.channel.id].args.push(args[i]);
            pollState[msg.channel.id].votes.push(0);
            embed.addField(i, args[i]);
          }
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'Only up to 25 answer choices are allowed.');
      } else bot.sendError(msg.channel, 'A poll is already running on this channel.');
    },
  },
  {
    name: 'polldata',
    description: 'View poll data on the current channel without ending the poll.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (pollState[msg.channel.id]) showPollData(bot, msg.channel);
      else bot.sendError(msg.channel, 'No poll is running on this channel.');
    },
  },
  {
    name: 'endpoll',
    description: 'End the poll on the current channel.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (pollState[msg.channel.id]) {
        showPollData(bot, msg.channel);
        delete pollState[msg.channel.id];
      } else bot.sendError(msg.channel, 'No poll is running on this channel.');
    },
  },
  {
    name: 'vote',
    description: 'Vote in the current poll.',
    argumentNames: ['<choiceNumber>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (pollState[msg.channel.id]) {
        const choice = parseInt(args[0], 10) - 1;
        if (choice < pollState[msg.channel.id].votes.length) {
          if (!pollState[msg.channel.id].users.has(msg.author.id)) {
            pollState[msg.channel.id].votes[choice]++;
            pollState[msg.channel.id].users.add(msg.author.id);
            msg.react('✅');
          } else bot.sendError(msg.channel, 'You have already voted on this poll.');
        } else bot.sendError(msg.channel, `Choice ${choice + 1} does not exist.`);
      } else bot.sendError(msg.channel, 'No poll is running on this channel.');
    },
  },
];
