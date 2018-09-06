const discord = require("discord.js");
const _ = require("lodash");
const request = require("request");

const urbanDictionaryURL = "https://api.urbandictionary.com/v0";
const openWeatherMapURL = "http://api.openweathermap.org/data/2.5/";

const pollState = {};

module.exports.init = async function(bot) {
    if (!_.has(bot.config, "modules.utils.openWeatherMapKey")) {
        _.set(bot.config, "modules.utils.openWeatherMapKey", "Replace with your OpenWeatherMap API Key");
        bot.saveConfig(err => {});
        bot.log.modwarn("Utils: OpenWeatherMap API key not specified in config.json. Weather command will not work.");
    }
    if (!_.has(bot.config, "modules.utils.weatherImperialUnits")) {
        _.set(bot.config, "modules.utils.weatherImperialUnits", false);
        bot.saveConfig(err => {});
    }
}

module.exports.commands = [
    {
        name: "urban",
        description: "Search Urban Dictionary for a word.",
        argumentNames: ["<query>"],
        permissionLevel: "all",
        aliases: ["ud"],
        execute: async function(args, msg, bot) {
            request(`${urbanDictionaryURL}/define?page=${1}&term=${args.join("%20")}`, (err, response, body) => {
                if (!err) {
                    const json = JSON.parse(body);
                    if (json.list && json.list.length > 0) {
                        const result = json.list[0];
                        let contents = result.definition.replace(/[\[\]]/ig, "") + "\n\n"
                                       + result.example.replace(/[\[\]]/ig, "");
                        if (contents.length > 1990) {
                            contents = contents.substring(0, 1990) + "...\n\nDefinition too long to display here.";
                        }
                        const embed = new discord.RichEmbed()
                            .setTitle(`Urban Dictionary: ${args.join(" ")}`)
                            .setColor(bot.config.defaultColors.success)
                            .setURL(result.permalink)
                            .setDescription(contents);
                        msg.channel.send({embed});
                    } else msg.channel.send(`❌ Word not found.`);
                } else msg.channel.send(`❌ Error getting definiton.`);
            });
        }
    },
    {
        name: "weather",
        description: "Get current weather at a location.",
        argumentNames: ["<cityName,countryCode>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const imperial = bot.config.modules.utils.weatherImperialUnits;
            let units = imperial ? "imperial" : "metric";
            request(`${openWeatherMapURL}/weather?q=${args.join("%20")}&units=${units}&appid=${bot.config.modules.utils.openWeatherMapKey}`, (err, response, body) => {
                if (!err) {
                    const json = JSON.parse(body);
                    if (json.cod == 200) {
                        const embed = new discord.RichEmbed()
                            .setTitle(`Weather in ${json.name}`)
                            .setColor(bot.config.defaultColors.success)
                            .addField("🌞 Conditions", json.weather[0].main, true)
                            .addField("🌡️ Temperature", `${json.main.temp} ${imperial ? "°F" : "°C"}`, true)
                            .addField("😓 Humidity", `${json.main.humidity} %`, true)
                            .setFooter("Powered by OpenWeatherMap");
                        if (json.wind) embed.addField("💨 Wind Speed", `${json.wind.speed} ${imperial ? "mph" : "m/s"}`, true);
                        if (json.clouds) embed.addField("☁️ Clouds", `${json.clouds.all} %`, true);
                        msg.channel.send({embed});
                    } else if (json.cod == 404) msg.channel.send(`❌ Location not found.`);
                    else msg.channel.send(`❌ Error getting weather.`);
                } else msg.channel.send(`❌ Error getting weather.`);
            });
        }
    },
    {
        name: "poll",
        description: "Create a poll on the current channel.",
        argumentNames: [`"question"`, `"answer-1"`, `"answer-n"`],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (!pollState[msg.channel.id]) {
                if (args.length < 25) {
                    pollState[msg.channel.id] = {
                        question: args[0], args: [], votes: [], users: new Set()
                    };
                    const embed = new discord.RichEmbed()
                        .setTitle(args[0])
                        .setColor(bot.config.defaultColors.success)
                        .setDescription(`Use \`${bot.prefixForMessageContext(msg)}vote <choiceNumber\` to vote.`);
                    for (var i = 1; i < args.length; i++) {
                        pollState[msg.channel.id].args.push(args[i]);
                        pollState[msg.channel.id].votes.push(0);
                        embed.addField(i, args[i]);
                    }
                    msg.channel.send({embed});
                } else msg.channel.send(`❌ Only up to 25 answer choices are allowed.`);
            } else msg.channel.send(`❌ A poll is already running on this channel.`);
        }
    },
    {
        name: "polldata",
        description: "View poll data on the current channel without ending the poll.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (pollState[msg.channel.id]) showPollData(bot, msg.channel);
            else msg.channel.send(`❌ No poll is running on this channel.`);
        }
    },
    {
        name: "endpoll",
        description: "End the poll on the current channel.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (pollState[msg.channel.id]) {
                showPollData(bot, msg.channel);
                delete pollState[msg.channel.id];
            } else msg.channel.send(`❌ No poll is running on this channel.`);
        }
    },
    {
        name: "vote",
        description: "Vote in the current poll.",
        argumentNames: ["<choiceNumber>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (pollState[msg.channel.id]) {
                const choice = parseInt(args[0]) - 1;
                if (choice < pollState[msg.channel.id].votes.length) {
                    if (!pollState[msg.channel.id].users.has(msg.author.id)) {
                        pollState[msg.channel.id].votes[choice]++;
                        pollState[msg.channel.id].users.add(msg.author.id);
                        msg.react("✅");
                    } else msg.channel.send(`❌ You have already voted on this poll.`);
                } else msg.channel.send(`❌ Choice ${choice + 1} does not exist.`);
            } else msg.channel.send(`❌ No poll is running on this channel.`);
        }
    }
]

function showPollData(bot, channel) {
    const embed = new discord.RichEmbed()
        .setTitle("Poll Results")
        .setColor(bot.config.defaultColors.success)
        .setDescription(`Question: ${pollState[channel.id].question}`);
    pollState[channel.id].args.forEach((option, i) => {
        const votes = pollState[channel.id].votes[i];
        embed.addField(`${i + 1}: ${option}`, `${votes} vote${votes == 1 ? "" : "s"}`);
    });
    channel.send({embed});
}
