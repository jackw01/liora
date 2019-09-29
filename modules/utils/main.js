// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).

const discord = require('discord.js');
const prettyMs = require('pretty-ms');

const pollState = {};
const deletedMessages = {};
const editedMessages = {};
const editEvents = {};

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

function onMessageDelete(msg) {
  const msg2 = msg;
  msg2.deletedAt = Date.now();
  if (!deletedMessages[msg.channel.id]) deletedMessages[msg.channel.id] = [];
  deletedMessages[msg.channel.id].unshift(msg2);
}

function onMessageUpdate(oldMsg, newMsg) {
  if (oldMsg.content !== newMsg.content) {
    if (!editedMessages[newMsg.channel.id]) editedMessages[newMsg.channel.id] = [];
    if (!editEvents[newMsg.channel.id]) editEvents[newMsg.channel.id] = [];
    if (!editedMessages[newMsg.channel.id][newMsg.id]) {
      editedMessages[newMsg.channel.id][newMsg.id] = [oldMsg];
    }
    editedMessages[newMsg.channel.id][newMsg.id].unshift(newMsg);
    editEvents[newMsg.channel.id].unshift({ oldMsg, newMsg });
  }
}

function displayDeletedMessage(bot, delMsg) {
  const embed = new discord.RichEmbed()
    .setColor(bot.config.defaultColors.neutral)
    .setDescription(delMsg.content)
    .setAuthor(bot.util.username(delMsg.author), delMsg.author.displayAvatarURL)
    .setFooter(`Deleted ${prettyMs(Date.now() - delMsg.deletedAt)} ago`)
    .setTimestamp(delMsg.createdAt);
  let lastImage;
  if (delMsg.embeds.length) {
    delMsg.embeds.forEach((e) => { if (e.image) lastImage = e.image; });
  } else if (delMsg.attachments.size) {
    delMsg.attachments.forEach((a) => { if (a.width) lastImage = a; });
  }
  if (lastImage) embed.setImage(lastImage.url);
  delMsg.channel.send({ embed });
}

module.exports.init = async function init(bot) {
  bot.client.on('messageDelete', onMessageDelete);
  bot.client.on('messageUpdate', onMessageUpdate);
};

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
            .setTitle(`Channel info for #${channel.name}`)
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
  {
    name: 'recall',
    description: 'Recall the last 25 deleted messages in the current channel.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (deletedMessages[msg.channel.id]) {
        const embed = new discord.RichEmbed()
          .setTitle(`Deleted messages from #${msg.channel.name}`)
          .setColor(bot.config.defaultColors.neutral);
        deletedMessages[msg.channel.id].slice(0, 24).forEach((delMsg, i) => {
          if (delMsg.content) {
            embed.addField(`${i + 1}: ${bot.util.username(delMsg.author)}, sent ${prettyMs(Date.now() - delMsg.createdAt)} ago`, delMsg.content);
          }
        });
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'No deleted messages from this channel.');
    },
  },
  {
    name: 'snipe',
    description: 'Recall the last deleted message in the current channel. If a user mention, username, or nickname is supplied, the last deleted message from that user will be shown.',
    argumentNames: ['<user>?'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (deletedMessages[msg.channel.id]) {
        let delMsg;
        if (args.length) {
          if (msg.guild) {
            const user = bot.util.parseUsername(args.join(' '), msg.guild);
            deletedMessages[msg.channel.id].reverse().forEach((m) => {
              if (m.author.id === user.id) delMsg = m;
            });
          } else bot.sendError(msg.channel, 'Must be in a server to use this command with a username.');
        } else delMsg = deletedMessages[msg.channel.id][0];

        if (delMsg) {
          displayDeletedMessage(bot, delMsg);
        } else bot.sendError(msg.channel, 'No deleted messages by this user found.');
      } else bot.sendError(msg.channel, 'No deleted messages from this channel.');
    },
  },
  {
    name: 'recalledits',
    description: 'Recall the old message versions from the last 25 message edits in the current channel.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: ['edits'],
    async execute(args, msg, bot) {
      if (editEvents[msg.channel.id]) {
        const embed = new discord.RichEmbed()
          .setTitle(`Recent message edits from #${msg.channel.name}`)
          .setColor(bot.config.defaultColors.neutral);
        editEvents[msg.channel.id].slice(0, 24).forEach(({ oldMsg, newMsg }, i) => {
          embed.addField(`${i + 1}: ${bot.util.username(newMsg.author)}, edited ${prettyMs(Date.now() - newMsg.editedAt)} ago`, `**Previous message:** ${oldMsg.content}, **New message:** ${newMsg.content}`);
        });
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'No edits from this channel.');
    },
  },
  {
    name: 'lastedit',
    description: 'Recall the old message versions from the last edited message in the current channel.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: ['esnipe'],
    async execute(args, msg, bot) {
      if (editEvents[msg.channel.id]) {
        const firstEdit = editEvents[msg.channel.id][0];
        const eMsg = firstEdit.newMsg;
        const embed = new discord.RichEmbed()
          .setColor(bot.config.defaultColors.neutral)
          .setDescription('Revisions of message from earliest to current')
          .setAuthor(bot.util.username(eMsg.author), eMsg.author.displayAvatarURL)
          .setFooter(`Current message: ${eMsg.content}`);
        editEvents[msg.channel.id].slice(0, 24).forEach(({ oldMsg, newMsg }, i) => {
          if (newMsg.id === eMsg.id) embed.addField(`${i + 1}: from ${prettyMs(Date.now() - newMsg.editedAt)} ago`, oldMsg.content || '[No text content]');
        });
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'No edits from this channel.');
    },
  },
];
