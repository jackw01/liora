// Liora - Modular and extensible Node.js Discord bot
// Copyright 2018 jackw01. Released under the MIT License (see LICENSE for details).

const discord = require('discord.js');
const _ = require('lodash');
const request = require('request');
const translate = require('google-translate-api');

const urbanDictionaryURL = 'https://api.urbandictionary.com/v0';
const openWeatherMapURL = 'http://api.openweathermap.org/data/2.5';
const xkcdURL = 'https://xkcd.com';
const wikipediaURL = 'https://en.wikipedia.org/w/api.php';
const redditURL = 'https://www.reddit.com';
const imgurURL = 'https://api.imgur.com/3';
const googleImagesURL = 'https://images.google.com';

const isGifRegex = /(.*(imgur\.com|i\.imgur\.com|i\.redd\.it).*(gifv|gif)$|.*gfycat\.com.*)/;
const isImageRegex = /.*(imgur\.com|i\.imgur\.com|i\.redd\.it|i\.reddituploads\.com).*/;
const gifExtensionRegex = /.*(gifv|gif)$/;

const redditSearchCounter = {};
const imgurSearchCounter = {};

let lastMessageText;
let lastMessageBuffer;
let lastImage;

function showRedditResult(msg, bot, queryURL, queryString, filter) {
  request(queryURL, (err, response, body) => {
    if (!err) {
      try {
        const json = JSON.parse(body);
        const posts = json.data.children.filter(filter);
        if (posts.length) {
          if (_.has(redditSearchCounter, queryString)) {
            redditSearchCounter[queryString]++;
            setTimeout(() => {
              redditSearchCounter[queryString] = 0;
            }, 10 * 60 * 1000);
          } else redditSearchCounter[queryString] = 0;
          const post = posts[redditSearchCounter[queryString] % (posts.length - 1)];
          const embed = new discord.MessageEmbed()
            .setTitle(`Reddit image for ${queryString}`)
            .setColor(bot.config.defaultColors.success)
            .setDescription(post.data.title)
            .setImage(post.data.url)
            .setURL(`${redditURL}${post.data.permalink}`)
            .setFooter(new Date(post.data.created * 1000));
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'No results found.');
      } catch (error) {
        bot.sendError(msg.channel, 'Error searching Reddit.', 'Error parsing results.');
      }
    } else bot.sendError(msg.channel, 'Error searching Reddit.', 'Request failed.');
  });
}

function redditSubPostHandler(msg, args, bot, gif) {
  let view = 'hot';
  let opt = '';
  if (args.length > 1) {
    if (['hour', 'day', 'week', 'month', 'year', 'all'].includes(args[args.length - 1])) {
      view = 'top';
      opt = `?t=${args[args.length - 1]}`;
    } else {
      bot.sendError(msg.channel, 'Subreddit name must be one word. If you are specifying a time range, it must be hour, day, week, month, year, or all.');
      return;
    }
  }
  showRedditResult(
    msg, bot, `${redditURL}/r/${args[0]}/${view}/.json${opt}`, args.join(' '),
    (post) => {
      if (!post.data.stickied && !post.data.pinned) {
        if (gif) return isGifRegex.test(post.data.url);
        return isImageRegex.test(post.data.url) && !gifExtensionRegex.test(post.data.url);
      }
      return false;
    },
  );
}

module.exports.init = async function init(bot) {
  if (bot.configSetDefault('modules.search.openWeatherMapKey', 'Replace with your OpenWeatherMap API Key')) {
    bot.log.modwarn('Search: OpenWeatherMap API key not specified in config.json. Weather command disabled.');
    module.exports.commands = module.exports.commands.filter(c => c.name !== 'weather');
  }
  bot.configSetDefault('modules.search.weatherImperialUnits', false);
  if (bot.configSetDefault('modules.search.imgurClientID', 'Replace with your Imgur Client ID')) {
    bot.log.modwarn('Search: Imgur Client ID not specified in config.json. Imgur command disabled.');
    module.exports.commands = module.exports.commands.filter(c => c.name !== 'imgur');
  }
};

module.exports.commands = [
  {
    name: 'wikipedia',
    description: 'Search Wikipedia.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: ['wiki'],
    async execute(args, msg, bot) {
      request(`${wikipediaURL}?action=opensearch&search=${args.join('%20')}&limit=5&namespace=0&format=json`, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (json[1].length) {
              const embed = new discord.MessageEmbed()
                .setTitle(`Wikipedia Search: ${args.join(' ')}`)
                .setColor(bot.config.defaultColors.success);
              for (let i = 0; i < json[1].length; i++) {
                let contents = json[2][i];
                if (contents.length > 1000) {
                  contents = `${contents.substring(0, 1000)}...\n\nDescription too long to display here.`;
                }
                embed.addField(json[1][i], `[${contents}](${json[3][i]})`, false);
              }
              msg.channel.send({ embed });
            } else bot.sendError(msg.channel, 'No results found.');
          } catch (error) {
            bot.sendError(msg.channel, 'Error searching Wikipedia.', 'Error parsing results.');
          }
        } else bot.sendError(msg.channel, 'Error searching Wikipedia.', 'Request failed.');
      });
    },
  },
  {
    name: 'redditimgsearch',
    description: 'Search imgur.com and i.redd.it image (not gif) links on Reddit and post one of the top results.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: ['rimgsearch'],
    async execute(args, msg, bot) {
      showRedditResult(
        msg, bot, `${redditURL}/search.json?q=${args.join('%20')}&sort=top`, args.join(' '),
        post => isImageRegex.test(post.data.url) && !gifExtensionRegex.test(post.data.url),
      );
    },
  },
  {
    name: 'redditgifsearch',
    description: 'Search imgur.com, gfycat, and i.redd.it gif/v links on Reddit and post one of the top results.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: ['rgifsearch'],
    async execute(args, msg, bot) {
      showRedditResult(
        msg, bot, `${redditURL}/search.json?q=${args.join('%20')}&sort=top`, args.join(' '),
        post => isGifRegex.test(post.data.url),
      );
    },
  },
  {
    name: 'redditimg',
    description: 'Get a image from the front page of a subreddit. Specify a time range to get an image from top posts.',
    argumentNames: ['<subreddit>', '<hour|day|week|month|year|all>?'],
    permissionLevel: 'all',
    aliases: ['rimg'],
    async execute(args, msg, bot) {
      redditSubPostHandler(msg, args, bot, false);
    },
  },
  {
    name: 'redditgif',
    description: 'Get a gif or gifv from the front page of a subreddit.',
    argumentNames: ['<subreddit>', '<hour|day|week|month|year|all>?'],
    permissionLevel: 'all',
    aliases: ['rgif'],
    async execute(args, msg, bot) {
      redditSubPostHandler(msg, args, bot, true);
    },
  },
  {
    name: 'imgur',
    description: 'Get a recent image from Imgur, filtered by subreddit. Does not show images based on Reddit votes and does not provide a link to Reddit comments. Specify a time range to get an image from top posts.',
    argumentNames: ['<subreddit>', '<hour|day|week|month|year|all>?'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      const queryString = args.join(' ');
      let sort = 'time';
      let opt = '';
      if (args.length > 1) {
        if (['hour', 'day', 'week', 'month', 'year', 'all'].includes(args[args.length - 1])) {
          sort = 'top';
          opt = `/${args[args.length - 1]}`;
        } else {
          bot.sendError(msg.channel, 'Subreddit name must be one word. If you are specifying a time range, it must be hour, day, week, month, year, or all.');
          return;
        }
      }
      const opts = {
        url: `${imgurURL}/gallery/r/${args[0]}/${sort}${opt}`,
        headers: { Authorization: `Client-ID ${bot.config.modules.search.imgurClientID}` },
      };
      request(opts, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (json.success && json.data && json.data.length) {
              if (_.has(imgurSearchCounter, queryString)) {
                imgurSearchCounter[queryString]++;
                setTimeout(() => {
                  imgurSearchCounter[queryString] = 0;
                }, 10 * 60 * 1000);
              } else imgurSearchCounter[queryString] = 0;
              const post = json.data[imgurSearchCounter[queryString] % (json.data.length - 1)];
              const embed = new discord.MessageEmbed()
                .setTitle(`Imgur image for /r/${queryString}`)
                .setColor(bot.config.defaultColors.success)
                .setDescription(post.title)
                .setImage(post.link)
                .setURL(post.link)
                .setFooter(new Date(post.datetime * 1000));
              msg.channel.send({ embed });
            } else bot.sendError(msg.channel, 'No results found.');
          } catch (error) {
            bot.sendError(msg.channel, 'Error searching Imgur.', 'Error parsing results.');
          }
        } else bot.sendError(msg.channel, 'Error searching Imgur.', 'Request failed.');
      });
    },
  },
  {
    name: 'urban',
    description: 'Search Urban Dictionary for a word.',
    argumentNames: ['<query>'],
    permissionLevel: 'all',
    aliases: ['ud'],
    async execute(args, msg, bot) {
      request(`${urbanDictionaryURL}/define?page=${1}&term=${args.join('%20')}`, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (json.list && json.list.length > 0) {
              const result = json.list[0];
              let contents = `${result.definition.replace(/[[\]]/ig, '')}\n\n${result.example.replace(/[[\]]/ig, '')}`;
              if (contents.length > 1990) {
                contents = `${contents.substring(0, 1990)}...\n\nDefinition too long to display here.`;
              }
              const embed = new discord.MessageEmbed()
                .setTitle(`Urban Dictionary: ${args.join(' ')}`)
                .setColor(bot.config.defaultColors.success)
                .setURL(result.permalink)
                .setDescription(contents);
              msg.channel.send({ embed });
            } else bot.sendError(msg.channel, 'Word not found.');
          } catch (error) {
            bot.sendError(msg.channel, 'Error searching Urban Dictionary.', 'Error parsing results.');
          }
        } else bot.sendError(msg.channel, 'Error searching Urban Dictionary.', 'Request failed.');
      });
    },
  },
  {
    name: 'weather',
    description: 'Get current weather at a location.',
    argumentNames: ['<cityName,countryCode>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      const imperial = bot.config.modules.search.weatherImperialUnits;
      const units = imperial ? 'imperial' : 'metric';
      request(`${openWeatherMapURL}/weather?q=${args.join('%20')}&units=${units}&appid=${bot.config.modules.search.openWeatherMapKey}`, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (json.cod === 200) {
              const embed = new discord.MessageEmbed()
                .setTitle(`Weather in ${json.name}`)
                .setColor(bot.config.defaultColors.success)
                .addField('🌞 Conditions', json.weather[0].main, true)
                .addField('🌡️ Temperature', `${json.main.temp} ${imperial ? '°F' : '°C'}`, true)
                .addField('😓 Humidity', `${json.main.humidity} %`, true)
                .setFooter('Powered by OpenWeatherMap');
              if (json.wind) embed.addField('💨 Wind Speed', `${json.wind.speed} ${imperial ? 'mph' : 'm/s'}`, true);
              if (json.clouds) embed.addField('☁️ Clouds', `${json.clouds.all} %`, true);
              msg.channel.send({ embed });
            } else if (json.cod === 404) bot.sendError(msg.channel, 'Location not found.');
            else bot.sendError(msg.channel, 'Error getting weather.', 'Unknown: OpenWeatherMap error.');
          } catch (error) {
            bot.sendError(msg.channel, 'Error getting weather.', 'Error parsing results.');
          }
        } else bot.sendError(msg.channel, 'Error getting weather.', 'Request failed.');
      });
    },
  },
  {
    name: 'xkcd',
    description: 'Show an xkcd comic. Gets the latest comic by default. Specify a number or \'random\' to get a specific or random comic.',
    argumentNames: ['<number>?'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      function postXkcd(data) {
        const embed = new discord.MessageEmbed()
          .setTitle(`xkcd ${data.num}: ${data.safe_title} (${data.year}-${_.padStart(data.month, 2, 0)}-${_.padStart(data.day, 2, 0)})`)
          .setColor(bot.config.defaultColors.success)
          .setImage(data.img)
          .setFooter(data.alt);
        msg.channel.send({ embed });
      }

      request(`${xkcdURL}/info.0.json`, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (args.length === 0) {
              postXkcd(json);
            } else {
              const num = parseInt(args[0], 10);
              if (num <= json.num && num !== 404 && num > 0) {
                request(`${xkcdURL}/${num ? `${num}/` : ''}info.0.json`, (finalErr, finalResponse, finalBody) => {
                  try {
                    if (!finalErr) postXkcd(JSON.parse(finalBody));
                    else bot.sendError(msg.channel, 'Error getting xkcd.', 'Request failed.');
                  } catch (error) {
                    bot.sendError(msg.channel, 'Error getting xkcd.', 'Error parsing results.');
                  }
                });
              } else bot.sendError(msg.channel, 'Error getting xkcd.', 'Unknown error.');
            }
          } catch (error) {
            bot.sendError(msg.channel, 'Error getting xkcd.', 'Error parsing results.');
          }
        } else bot.sendError(msg.channel, 'Error getting xkcd.', 'Request failed.');
      });
    },
  },
  {
    name: 'reverseimg',
    description: 'Reverse image search the last posted image on the current channel or the image attached to the message with this command.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (lastImage) {
        const embed = new discord.MessageEmbed()
          .setTitle('Reverse image search for the last image on this channel')
          .setColor(bot.config.defaultColors.success)
          .setDescription(`${googleImagesURL}/searchbyimage?image_url=${lastImage.url}`)
          .setThumbnail(lastImage.url);
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'Can\'t find an image.');
    },
  },
  {
    name: 'reverseprofilepic',
    description: 'Reverse image search the profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.',
    argumentNames: ['<user>?'],
    permissionLevel: 'all',
    aliases: ['reverseavatar', 'reversepfp'],
    async execute(args, msg, bot) {
      if (msg.guild) {
        let result;
        if (args.length) result = bot.util.parseUsername(args.join(' '), msg.guild);
        else result = [msg.author];
        if (result) {
          const user = result[0];
          const embed = new discord.MessageEmbed()
            .setTitle(`Reverse image search of profile picture for ${bot.util.username(user)}`)
            .setColor(bot.config.defaultColors.success)
            .setDescription(`${googleImagesURL}/searchbyimage?image_url=${user.avatarURL}`)
            .setThumbnail(user.avatarURL);
          msg.channel.send({ embed });
        } else bot.sendError(msg.channel, 'User not found.');
      } else bot.sendError(msg.channel, 'Must be in a server to use this command.');
    },
  },
  {
    name: 'translate',
    description: 'Translate something to the specified language.',
    argumentNames: ['<languageTo>', '<text>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (translate.languages.isSupported(args[0])) {
        translate(args.slice(1).join(' '), { to: args[0] }).then((res) => {
          const embed = new discord.MessageEmbed()
            .setTitle('Translation Result')
            .setColor(bot.config.defaultColors.success)
            .setDescription(res.text)
            .setFooter(`Detected language: ${res.from.language.iso}`);
          msg.channel.send({ embed });
        }).catch((err) => {
          bot.sendError(msg.channel, `Error translating message: ${err.message}.`);
        });
      } else bot.sendError(msg.channel, `Language "${args[0]}" not recognized.`);
    },
  },
  {
    name: 'translatelast',
    description: 'Translate the last posted message on the current channel. Automatically detects the language of the last message.',
    argumentNames: ['<languageTo>'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (lastMessageText) {
        if (translate.languages.isSupported(args[0])) {
          translate(lastMessageText, { to: args[0] }).then((res) => {
            const embed = new discord.MessageEmbed()
              .setTitle('Translation Result')
              .setColor(bot.config.defaultColors.success)
              .setDescription(res.text)
              .setFooter(`Detected language: ${res.from.language.iso}`);
            msg.channel.send({ embed });
          }).catch((err) => {
            bot.sendError(msg.channel, `Error translating message: ${err.message}.`);
          });
        } else bot.sendError(msg.channel, `Language "${args[0]}" not recognized.`);
      } else bot.sendError(msg.channel, 'Can\'t find a last message.');
    },
  },
];

module.exports.middleware = [
  (c, next) => {
    if (c.message.attachments.size) c.message.attachments.forEach((a) => { if (a.width) lastImage = a; });
    else if (c.message.embeds.length) c.message.embeds.forEach((e) => { if (e.image) lastImage = e.image; });
    if (c.message.content) {
      lastMessageText = lastMessageBuffer;
      lastMessageBuffer = c.message.content;
    }
    next();
  },
];
