const discord = require("discord.js");
const _ = require("lodash");
const request = require("request");

const urbanDictionaryURL = "https://api.urbandictionary.com/v0";
const openWeatherMapURL = "http://api.openweathermap.org/data/2.5/";

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
                    } else {
                        msg.channel.send(`❌ Word not found.`);
                    }
                } else {
                    msg.channel.send(`❌ Error getting definiton.`);
                }
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
                } else {
                    msg.channel.send(`❌ Error getting weather.`);
                }
            });
        }
    }
]
