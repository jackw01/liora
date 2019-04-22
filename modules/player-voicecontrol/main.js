// Liora - Modular and extensible Node.js Discord bot
// Copyright 2019 jackw01. Released under the MIT License (see LICENSE for details).

const fs = require('fs');
const process = require('process');
const stream = require('stream');
const discord = require('discord.js');
const _ = require('lodash');
const ytdl = require('ytdl-core');
const request = require('request');
const validUrl = require('valid-url');
const prettyMs = require('pretty-ms');
const FFmpeg = require('fluent-ffmpeg');
const audioMixer = require('audio-mixer');
const wav = require('wav');
const snowboy = require('snowboy');

// In order to receive audio, we need to play something
class Silence extends stream.Readable {
  _read() {
    this.push(Buffer.from([0xF8, 0xFF, 0xFE]));
  }
}

// Listen for a fixed time period
const listenPeriod = 5000;

// Set up hotword detection
const models = new snowboy.Models();
models.add({
  file: 'modules/player-voicecontrol/alexa.umdl',
  sensitivity: '0.6',
  hotwords: 'alexa',
});

const state = {};
const listeningState = {};

function playNextQueuedVideo(connection, msg, bot) {
  const { id } = msg.guild;
  state[id].nowPlaying = state[id].queue[0];
  state[id].queue.shift();
  state[id].stream = ytdl(state[id].nowPlaying.url, { filter: 'audioonly' });
  state[id].dispatcher = connection.playStream(state[id].stream);
  state[id].dispatcher.setVolumeLogarithmic(bot.config.modules.player.servers[id].defaultVolume);
  // Set stream end event
  state[id].dispatcher.once('end', () => {
    if (state[id].queue.length > 0) {
      playNextQueuedVideo(msg, bot);
    } else {
      delete state[id].nowPlaying;
      state[id].playing = false;
      state[id].paused = false;
      state[id].voiceChannel.leave();
    }
  });
}

function enqueueVideo(id, msg, bot) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  ytdl.getInfo(url, (err, info) => {
    if (err) {
      bot.sendError(msg.channel, 'Video does not exist or cannot be played.');
    } else if (msg.guild) {
      state[msg.guild.id].queue.push({
        title: info.title,
        url,
        thumbnail: info.thumbnail_url,
        duration: parseFloat(info.length_seconds),
        user: msg.author,
      });
      // Generate queueing message
      let message;
      if (!state[msg.guild.id].nowPlaying && state[msg.guild.id].queue.length === 1) message = 'Now Playing';
      else message = 'Added to the Queue';
      const embed = new discord.RichEmbed()
        .setTitle(message)
        .setColor(bot.config.defaultColors.success)
        .setThumbnail(info.thumbnail_url)
        .setDescription(`**[${info.title}](${url})**`)
        .addField('Channel', `[${info.author.name}](${info.author.channel_url})`, true)
        .addField('Duration', `${prettyMs(info.length_seconds * 1000)}`, true)
        .addField('Views', info.player_response.videoDetails.viewCount, true)
        .addField('Position in queue', `${state[msg.guild.id].queue.length}`, true);
      msg.channel.send({ embed });
      if (!state[msg.guild.id].playing) {
        state[msg.guild.id].playing = true;
        // Connect to voice
        if (state[msg.guild.id].connection) {
          playNextQueuedVideo(state[msg.guild.id].connection, msg, bot);
        } else {
          state[msg.guild.id].voiceChannel.join().then((connection) => {
            state[msg.guild.id].connection = connection;
            playNextQueuedVideo(connection, msg, bot);
          }).catch((voiceErr) => {
            bot.sendError(msg.channel, 'Error connecting to voice channel:', `${voiceErr}`);
          });
        }
      }
    }
  });
}

function handleVoiceCommand(text, server, bot) {
  const words = text.split(' ').map(word => word.toLowerCase());
  if (words[0] === 'play') {
    const query = words.slice(1).join(' ');
    const { textChannel } = listeningState[server.id];
    request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${bot.config.modules.player.youtubeKey}`, (err, response, body) => {
      const json = JSON.parse(body);
      if ('error' in json) bot.sendError(textChannel, 'Error', `${json.error.errors[0].message}`);
      else if (json.items.length === 0) bot.sendError(textChannel, 'No videos found.');
      else {
        enqueueVideo(json.items[0].id.videoId, listeningState[server.id].referenceMessage, bot);
      }
    });
  } else if (['pause', 'resume', 'stop', 'skip', 'shuffle'].includes(words[0])) {
    module.exports.commands.find(cmd => cmd.name === words[0]).execute([], {}, bot, server);
  }
}

module.exports.init = async function init(bot) {
  if (bot.configSetDefault('modules.player.youtubeKey', 'Replace with your YouTube API Key')) {
    bot.log.modwarn('Player: YouTube API key not specified in config.json. YouTube search functionality will not work.');
  }

  if (bot.configSetDefault('modules.player.witKey', 'Replace with your Wit.ai token')) {
    bot.log.modwarn('Player: Wit.ai token not specified in config.json. Speech recognition functionality will not work.');
  }

  bot.client.guilds.array().forEach((server) => {
    // Initialize server-specific config
    bot.configSetDefault(`modules.player.servers[${server.id}]`, {
      defaultVolume: 0.5, volumeLimit: 1,
    });
    // Initialize state variables
    state[server.id] = {
      queue: [], stream: {}, dispatcher: {}, playing: false, paused: false,
    };

    // Initialize listening
    const det = new snowboy.Detector({
      resource: 'modules/player-voicecontrol/common.res',
      models,
      audioGain: 2.0,
      applyFrontend: true,
    });

    det.on('error', () => {
      bot.log.modwarn('Player: hotword detection error');
    });

    det.on('hotword', (index, hotword) => {
      bot.log.modinfo(`Player: hotword detected (${index}, ${hotword})`);

      const outputFileStream = new wav.FileWriter('test.wav', {
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
      });

      listeningState[server.id].mixer.pipe(outputFileStream);

      /*listeningState[server.id].mixer.pipe(request.post({
        url: 'https://api.wit.ai/speech?v=20170307',
        headers: {
          Authorization: `Bearer ${bot.config.modules.player.witKey}`,
          'Content-Type': 'audio/raw;encoding=signed-integer;bits=16;rate=16000;endian=little',
        },
      }, (err, response, body) => {
        console.log(err, response, body);
        const json = JSON.parse(body);
        bot.sendSuccess(listeningState[server.id].textChannel, `You said "${json['_text']}"`);
      }));*/

      /*const converter = FFmpeg(listeningState[server.id].mixer)
        .on('error', bot.log.modwarn)
        .on('codecData', bot.log.modwarn)
        .pipe(request.post({
          url: 'https://api.wit.ai/speech?v=20170307',
          headers: {
            Authorization: `Bearer ${bot.config.modules.player.witKey}`,
            'Content-Type': 'audio/raw;encoding=signed-integer;bits=16;rate=16000;endian=little',
          },
        }, (err, response, body) => {
          console.log(err, body);
          const json = JSON.parse(body);
          bot.sendSuccess(listeningState[server.id].textChannel, `You said "${json['_text']}"`);
        }));*/

      // Since streaming has issues, send the saved .wav file to Wit.ai for speech to text
      setTimeout(() => {
        request.post({
          url: 'https://api.wit.ai/speech?v=20170307',
          headers: {
            Authorization: `Bearer ${bot.config.modules.player.witKey}`,
            'Content-Type': 'audio/wav',
          },
          encoding: null,
          body: fs.createReadStream('test.wav'),
        }, (err, response, body) => {
          fs.unlinkSync('test.wav');
          console.log(err, response, body);
          const json = JSON.parse(body);
          bot.sendSuccess(listeningState[server.id].textChannel, `You said "${json['_text']}"`);
          handleVoiceCommand(json['_text'], server, bot);
        });
      }, listenPeriod);

      listeningState[server.id].silenceDispatcher.pause();
      if (!state[server.id].playing) state[server.id].connection.playFile('modules/player-voicecontrol/up.wav');
      else { // Lower volume of bot while listening
        const lastVolume = state[server.id].dispatcher.volumeLogarithmic;
        state[server.id].dispatcher.setVolumeLogarithmic(0.05);
        setTimeout(() => { state[server.id].dispatcher.setVolumeLogarithmic(lastVolume); }, listenPeriod);
      }
      listeningState[server.id].silenceDispatcher.resume();
      bot.log.modinfo('resumed');
    });

    const mix = new audioMixer.Mixer({
      channels: 1,
      bitDepth: 16,
      sampleRate: 16000,
      clearInterval: 250,
    });

    mix.pipe(det);

    listeningState[server.id] = {
      textChannel: {}, connection: {}, silenceDispatcher: {}, detector: det, mixer: mix,
    };
  });

  process.on('SIGINT', () => {
    bot.log.modwarn('Player: interrupting shutdown to leave voice channels');
    bot.client.guilds.array().forEach((server) => {
      if (state[server.id].voiceChannel) state[server.id].voiceChannel.leave();
    });
    process.exit();
  });
};

module.exports.commands = [
  {
    name: 'ytsearch',
    description: 'Display YouTube videos for a search query.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: ['youtube'],
    async execute(args, msg, bot) {
      request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(args.join(' '))}&key=${bot.config.modules.player.youtubeKey}`, (err, response, body) => {
        const json = JSON.parse(body);
        if ('error' in json) bot.sendError(msg.channel, 'Error', `${json.error.errors[0].message}`);
        else if (json.items.length === 0) bot.sendError(msg.channel, 'No videos found.');
        else {
          const embed = new discord.RichEmbed()
            .setTitle('Youtube Search Results')
            .setColor(bot.config.defaultColors.success)
            .setDescription(`Query: ${args.join(' ')}`);
          const resultCount = 5;
          let j = 0;
          for (let i = 0; i < resultCount; i++) {
            const url = `https://www.youtube.com/watch?v=${json.items[i].id.videoId}`;
            ytdl.getInfo(url, (ytErr, info) => {
              if (!ytErr) embed.addField(info.title, `${info.author.name} - ${url}`);
              if (++j >= resultCount) msg.channel.send({ embed });
            });
          }
        }
      });
    },
  },
  {
    name: 'listen',
    description: 'Start listening for voice commands in a voice channel. Available voice commands: play, pause, resume, stop, skip, shuffle. Say "alexa" in voice chat, wait for the sound, and say the command. To play a video, state the search query after saying "play".',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild && msg.member.voiceChannel) {
        state[msg.guild.id].voiceChannel = msg.member.voiceChannel;
        // Connect to voice
        state[msg.guild.id].voiceChannel.join().then((connection) => {
          state[msg.guild.id].connection = connection;
          listeningState[msg.guild.id].referenceMessage = msg;
          listeningState[msg.guild.id].textChannel = msg.channel;
          listeningState[msg.guild.id].silenceDispatcher = connection.playOpusStream(new Silence());
          bot.log.modinfo('Player: Join');
          const receiver = connection.createReceiver();
          connection.on('speaking', (user, speaking) => {
            if (speaking) {
              if (!listeningState[msg.guild.id][user.id]) listeningState[msg.guild.id][user.id] = {};
              listeningState[msg.guild.id][user.id].input = listeningState[msg.guild.id].mixer.input({
                channels: 1,
              });
              listeningState[msg.guild.id][user.id].voiceStream = receiver.createPCMStream(user);
              listeningState[msg.guild.id][user.id].voiceConverter =
                FFmpeg(listeningState[msg.guild.id][user.id].voiceStream)
                  .inputFormat('s32le')
                  .audioFrequency(16000)
                  .audioChannels(1)
                  .audioCodec('pcm_s16le')
                  .format('s16le')
                  .on('error', bot.log.modwarn)
                  .pipe(listeningState[msg.guild.id][user.id].input, { end: false });
            } else if (listeningState[msg.guild.id][user.id]) {
              listeningState[msg.guild.id].mixer.removeInput(listeningState[msg.guild.id][user.id].input);
            }
          });
        }).catch((err) => {
          bot.sendError(msg.channel, 'Error connecting to voice channel:', `${err}`);
        });
      } else bot.sendError(msg.channel, 'You must be in a voice channel to use this command.');
    },
  },
  {
    name: 'play',
    description: 'Play a YouTube video based on a search query or URL.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild && msg.member.voiceChannel) {
        const query = args.join(' ');
        if (validUrl.isUri(query)) {
          // Pass in the id only so url can be converted to a standard format
          const matches = query.match(/(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/);
          if (matches) {
            state[msg.guild.id].voiceChannel = msg.member.voiceChannel;
            enqueueVideo(matches[1], msg, bot);
          } else bot.sendError(msg.channel, 'URL does not appear to be a YouTube URL.');
        } else {
          request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${bot.config.modules.player.youtubeKey}`, (err, response, body) => {
            const json = JSON.parse(body);
            if ('error' in json) bot.sendError(msg.channel, 'Error', `${json.error.errors[0].message}`);
            else if (json.items.length === 0) bot.sendError(msg.channel, 'No videos found.');
            else {
              state[msg.guild.id].voiceChannel = msg.member.voiceChannel;
              enqueueVideo(json.items[0].id.videoId, msg, bot);
            }
          });
        }
      } else bot.sendError(msg.channel, 'You must be in a voice channel to use this command.');
    },
  },
  {
    name: 'pause',
    description: 'Pause the currently playing stream.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot, voiceServer = false) {
      const server = voiceServer || msg.guild;
      if (server) {
        if (state[server.id].playing) {
          state[server.id].paused = true;
          state[server.id].stream.pause();
          state[server.id].dispatcher.pause();
          if (!voiceServer) msg.react('⏸️');
        }
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'resume',
    description: 'Resume the currently playing stream.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot, voiceServer = false) {
      const server = voiceServer || msg.guild;
      if (server) {
        if (state[server.id].playing) {
          state[server.id].paused = false;
          state[server.id].stream.resume();
          state[server.id].dispatcher.resume();
          if (!voiceServer) msg.react('▶️');
        }
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'stop',
    description: 'Stop playback and clear the queue.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot, voiceServer = false) {
      const server = voiceServer || msg.guild;
      if (server) {
        state[server.id].queue = [];
        state[server.id].dispatcher.end();
        state[server.id].voiceChannel.leave();
        state[server.id].playing = false;
        state[server.id].paused = false;
        if (!voiceServer) msg.react('🛑');
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'skip',
    description: 'Skip the current stream in the queue.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot, voiceServer = false) {
      const server = voiceServer || msg.guild;
      if (server) {
        state[server.id].dispatcher.end();
        if (!voiceServer) msg.react('⏩');
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'volume',
    description: 'Set the volume. Value should be between 0 and 1. If no value is specified, displays the current volume.',
    argumentNames: ['<volume>?'],
    permissionLevel: 'all',
    aliases: ['vol'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        if (args.length === 0) {
          bot.sendEmojiEmbed(msg.channel, '🔊', bot.config.defaultColors.neutral, `Current volume: ${state[msg.guild.id].dispatcher.volumeLogarithmic.toFixed(2)}`);
        } else {
          state[msg.guild.id].dispatcher.setVolumeLogarithmic(_.clamp(args[0], 0, bot.config.modules.player.servers[msg.guild.id].volumeLimit));
          msg.react('🔊');
        }
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'shuffle',
    description: 'Shuffle the queue.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot, voiceServer = false) {
      const server = voiceServer || msg.guild;
      if (server) {
        state[server.id].queue = _.shuffle(state[msg.guild.id].queue);
        if (!voiceServer) msg.react('🔀');
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'nowplaying',
    description: 'Display the currently playing video.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: ['np'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        if (state[msg.guild.id].nowPlaying) {
          const embed = new discord.RichEmbed()
            .setTitle(`Now Playing on ${state[msg.guild.id].voiceChannel.name}`)
            .setColor(bot.config.defaultColors.neutral)
            .setThumbnail(state[msg.guild.id].nowPlaying.thumbnail)
            .setDescription(` **[${state[msg.guild.id].nowPlaying.title}](${state[msg.guild.id].nowPlaying.url})**\nenqueued by ${bot.util.username(state[msg.guild.id].nowPlaying.user)}\n`);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'Nothing is playing.');
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
  {
    name: 'queue',
    description: 'Display the queue.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (msg.guild) {
        if (state[msg.guild.id].queue.length > 0) {
          const embed = new discord.RichEmbed()
            .setTitle(`Queue for ${state[msg.guild.id].voiceChannel.name}`)
            .setColor(bot.config.defaultColors.neutral)
            .addField('Now Playing:', ` **[${state[msg.guild.id].nowPlaying.title}](${state[msg.guild.id].nowPlaying.url})**\n(enqueued by ${bot.util.username(state[msg.guild.id].nowPlaying.user)})`);
          let totalDuration = state[msg.guild.id].nowPlaying.duration;
          state[msg.guild.id].queue.forEach((item, i) => {
            if (i < 24) embed.addField(`${i + 1}. ${item.title}`, `${item.url} (enqueued by ${bot.util.username(item.user)})`);
            totalDuration += item.duration;
          });
          embed.setFooter(`${state[msg.guild.id].queue.length} in queue: total duration ${prettyMs(totalDuration * 1000)}`);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'Queue is empty.');
      } else bot.sendError(msg.channel, 'You must be in a server to use this command.');
    },
  },
];
