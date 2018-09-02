const discord = require("discord.js");
const _ = require("lodash");
const ytdl = require("ytdl-core");
const request = require("request");
const validUrl = require("valid-url");
const prettyMs = require("pretty-ms");

const state = {};

module.exports.init = async function(bot) {
    const servers = bot.client.guilds.array();
    for (let i = 0; i < servers.length; i++) {
        // Initialize server-specific config
        if (!_.has(bot.config, `modules.player.servers[${servers[i].id}]`)) {
            _.set(bot.config, `modules.player.servers[${servers[i].id}]`, {"voiceChannel": "", "defaultVolume": 0.5, "volumeLimit": 1});
            bot.saveConfig(err => {});
        }
        // Initialize state variables
        state[servers[i].id] = { queue: [], stream: {}, dispatcher: {}, playing: false, paused: false };
        //
        if (bot.config.modules.player.servers[servers[i].id].voiceChannel == "") {
            bot.log.modwarn(`Player: voice channel for server ${servers[i].id} not specified`);
        } else {
            const voiceChannel = servers[i].channels.find(channel => { return channel.type == "voice" && channel.id == bot.config.modules.player.servers[servers[i].id].voiceChannel });
            if (!voiceChannel) {
                bot.log.modwarn(`Player: voice channel ${bot.config.modules.player.servers[servers[i].id].voiceChannel} in server ${servers[i].id} not found`);
            } else {
                state[servers[i].id].voiceChannel = voiceChannel;
            }
        }
    }
}

module.exports.commands = [
    {
        name: "youtube",
        description: "Display YouTube videos for a search query.",
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
    },
    {
        name: "play",
        description: "Play a YouTube video based on a search query or URL.",
        argumentNames: ["<query>"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const query = args.join(" ");
            if (validUrl.isUri(query)) {
                // Pass in the id only so url can be converted to a standard format
                let matches = query.match(/(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/);
                if (matches) enqueueVideo(matches[1], msg, bot);
                else msg.channel.send("❌ URL does not appear to be a YouTube URL.");
            } else {
                request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${bot.config.modules.player.youtubeKey}`, (error, response, body) => {
            		const json = JSON.parse(body);
            		if ("error" in json) msg.channel.send(`❌ Error: ${json.error.errors[0].message}`);
            		else if (json.items.length == 0) msg.channel.send("❌ No videos found.");
            		else enqueueVideo(json.items[0].id.videoId, msg, bot);
            	});
            }
        }
    },
]

function enqueueVideo(id, msg, bot) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    ytdl.getInfo(url, (err, info) => {
        if (err) {
            msg.channel.send("❌ Video does not exist or cannot be played.");
        } else if (msg.guild) {
            state[msg.guild.id].queue.push({
                title: info.title,
                url: url,
                duration: parseFloat(info.length_seconds),
                user: msg.author.username
            });
            // Generate queueing message
            let message;
            if (!state[msg.guild.id].nowPlaying && state[msg.guild.id].queue.length == 1) message = `▶️ Now Playing`;
            else message = `▶️ Added to the Queue`;
            const embed = new discord.RichEmbed()
                .setTitle(message)
                .setColor(bot.config.defaultColors.success)
                .setThumbnail(info.thumbnail_url)
                .setDescription(`**[${info.title}](${url})**`)
                .addField("Channel", `[${info.author.name}](${info.author.channel_url})`, true)
                .addField("Duration", `${prettyMs(info.length_seconds * 1000)}`, true)
                .addField("Views", info.view_count, true)
                .addField("Position in queue", `${state[msg.guild.id].queue.length}`, true);
            msg.channel.send({embed});

            //if (!state[msg.guild.id].playing) playNextQueuedVideo(msg, bot);
        }
    });
}
