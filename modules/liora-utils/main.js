const discord = require("discord.js");
const request = require("request");

const urbanDictionaryURL = "https://api.urbandictionary.com/v0";

module.exports.init = async function(bot) {
}

module.exports.commands = [
    {
        name: "ud",
        description: "Search Urban Dictionary for a word.",
        argumentNames: ["<query>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            try {
                request(`${urbanDictionaryURL}/define?page=${1}&term=${args.join("%20")}`, (error, response, body) => {
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
                });
            } catch (err) {
                msg.channel.send(`❌ Error getting definiton.`);
            }
        }
    }
]
