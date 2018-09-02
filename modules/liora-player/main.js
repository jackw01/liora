const discord = require("discord.js");
const _ = require("lodash");
const ytdl = require("ytdl-core");
const request = require("request");
const validUrl = require("valid-url");
const prettyMs = require("pretty-ms");

const state = {};

module.exports.init = async function(bot) {
}

module.exports.commands = [
    {
        name: "youtube",
        description: "Display youtube video for a search query.",
        argumentNames: ["<query>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(args.join(" "))}&key=${bot.config.modules.player.youtubeKey}`, (error, response, body) => {
                const json = JSON.parse(body);
                if ("error" in json) msg.channel.send(`❌ Error: ${json.error.errors[0].message}`);
                else if (json.items.length == 0) msg.channel.send("❌ No videos found.");
                else {
                    const embed = new discord.RichEmbed()
                        .setTitle("Youtube Search Results")
                        .setColor(bot.config.defaultColors.success)
                        .setDescription(`Query: ${args.join(" ")}`);
                    const resultCount = 5;
                    let j = 0;
                    for (let i = 0; i < resultCount; i++) {
                        const url = `https://www.youtube.com/watch?v=${json.items[i].id.videoId}`;
                        ytdl.getInfo(url, (err, info) => {
                            if (!err) embed.addField(info.title, `${info.author.name} - ${url}`);
                            if (++j >= resultCount) msg.channel.send({embed});
                        });
                    }
                }
            });
        }
    }
]
