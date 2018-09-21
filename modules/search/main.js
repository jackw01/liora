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
const googleImagesURL = 'https://images.google.com';

const isGifRegex = /(.*(imgur\.com|i\.redd\.it).*(gifv|gif)$|.*gfycat\.com.*)/;
const isImageRegex = /.*(imgur\.com|i\.redd\.it).*/;
const gifExtensionRegex = /.*(gifv|gif)$/;

const redditSearchCounter = {};

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
          if (_.has(redditSearchCounter, queryString)) redditSearchCounter[queryString]++;
          else redditSearchCounter[queryString] = 0;
          const post = posts[redditSearchCounter[queryString] % (posts.length - 1)];
          const embed = new discord.RichEmbed()
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
  if (bot.configSetDefault('modules.utils.openWeatherMapKey', 'Replace with your OpenWeatherMap API Key')) {
    bot.saveConfig(() => {});
    bot.log.modwarn('Utils: OpenWeatherMap API key not specified in config.json. Weather command will not work.');
  }
  if (bot.configSetDefault('modules.utils.weatherImperialUnits', false)) {
    bot.saveConfig(() => {});
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
              const embed = new discord.RichEmbed()
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
              const embed = new discord.RichEmbed()
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
      const imperial = bot.config.modules.utils.weatherImperialUnits;
      const units = imperial ? 'imperial' : 'metric';
      request(`${openWeatherMapURL}/weather?q=${args.join('%20')}&units=${units}&appid=${bot.config.modules.utils.openWeatherMapKey}`, (err, response, body) => {
        if (!err) {
          try {
            const json = JSON.parse(body);
            if (json.cod === 200) {
              const embed = new discord.RichEmbed()
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
        const embed = new discord.RichEmbed()
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
    description: 'Reverse image search the last posted image on the current channel.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (lastImage) {
        const embed = new discord.RichEmbed()
          .setTitle('Reverse image search for the last image on this channel')
          .setColor(bot.config.defaultColors.success)
          .setURL(`${googleImagesURL}/searchbyimage?image_url=${lastImage.url}`)
          .setThumbnail(lastImage.url);
        msg.channel.send({ embed });
      } else bot.sendError(msg.channel, 'Can\'t find an image.');
    },
  },
  {
    name: 'translate',
    description: 'Translate something to the specified language. Text must be enclosed in quote marks.',
    argumentNames: ['languageTo', '"text"'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (translate.languages.isSupported(args[0])) {
        translate(args.slice(1).join(' '), { to: args[0] }).then((res) => {
          const embed = new discord.RichEmbed()
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
    argumentNames: ['languageTo'],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      if (lastMessageText) {
        if (translate.languages.isSupported(args[0])) {
          translate(lastMessageText, { to: args[0] }).then((res) => {
            const embed = new discord.RichEmbed()
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
    if (c.message.content) {
      lastMessageText = lastMessageBuffer;
      lastMessageBuffer = c.message.content;
    }
    next();
  },
];
