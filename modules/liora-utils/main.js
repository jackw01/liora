const discord = require('discord.js');
const _ = require('lodash');
const request = require('request');

const urbanDictionaryURL = 'https://api.urbandictionary.com/v0';
const openWeatherMapURL = 'http://api.openweathermap.org/data/2.5';
const xkcdURL = 'https://xkcd.com';
const wikipediaURL = 'https://en.wikipedia.org/w/api.php';
const redditURL = 'https://www.reddit.com';

const isGifRegex = /(.*(imgur\.com|i\.redd\.it).*(gifv|gif)$|.*gfycat\.com.*)/;
const isImageRegex = /.*(imgur\.com|i\.redd\.it).*/;
const gifExtensionRegex = /.*(gifv|gif)$/;

const redditSearchCounter = {};

const pollState = {};

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


module.exports.init = async function init(bot) {
  if (!_.has(bot.config, 'modules.utils.openWeatherMapKey')) {
    _.set(bot.config, 'modules.utils.openWeatherMapKey', 'Replace with your OpenWeatherMap API Key');
    bot.saveConfig(() => {});
    bot.log.modwarn('Utils: OpenWeatherMap API key not specified in config.json. Weather command will not work.');
  }
  if (!_.has(bot.config, 'modules.utils.weatherImperialUnits')) {
    _.set(bot.config, 'modules.utils.weatherImperialUnits', false);
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
