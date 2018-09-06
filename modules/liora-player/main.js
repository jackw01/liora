const discord = require("discord.js");
const _ = require("lodash");
const ytdl = require("ytdl-core");
const request = require("request");
const validUrl = require("valid-url");
const prettyMs = require("pretty-ms");

const state = {};

module.exports.init = async function(bot) {
    if (!_.has(bot.config, "modules.player.youtubeKey")) {
        _.set(bot.config, "modules.player.youtubeKey", "Replace with your YouTube API Key");
        bot.saveConfig(err => {});
        bot.log.modwarn("Player: YouTube API key not specified in config.json. YouTube search functionality will not work.");
    }

    const servers = bot.client.guilds.array();
    for (let i = 0; i < servers.length; i++) {
        // Initialize server-specific config
        if (!_.has(bot.config, `modules.player.servers[${servers[i].id}]`)) {
            _.set(bot.config, `modules.player.servers[${servers[i].id}]`, {"defaultVolume": 0.5, "volumeLimit": 1});
            bot.saveConfig(err => {});
        }
        // Initialize state variables
        state[servers[i].id] = { queue: [], stream: {}, dispatcher: {}, playing: false, paused: false };
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
            request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(args.join(" "))}&key=${bot.config.modules.player.youtubeKey}`, (err, response, body) => {
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
            if (msg.guild && msg.member.voiceChannel) {
                const query = args.join(" ");
                if (validUrl.isUri(query)) {
                    // Pass in the id only so url can be converted to a standard format
                    let matches = query.match(/(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/);
                    if (matches) enqueueVideo(matches[1], msg, bot);
                    else msg.channel.send("❌ URL does not appear to be a YouTube URL.");
                } else {
                    request(`https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=${encodeURIComponent(query)}&key=${bot.config.modules.player.youtubeKey}`, (err, response, body) => {
                		const json = JSON.parse(body);
                		if ("error" in json) msg.channel.send(`❌ Error: ${json.error.errors[0].message}`);
                		else if (json.items.length == 0) msg.channel.send("❌ No videos found.");
                		else {
                            state[msg.guild.id].voiceChannel = msg.member.voiceChannel;
                            enqueueVideo(json.items[0].id.videoId, msg, bot);
                        }
                	});
                }
            } else msg.channel.send("❌ You must be in a voice channel to use this command.");
        }
    },
    {
        name: "pause",
        description: "Pause the currently playing stream.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (state[msg.guild.id].playing) {
                state[msg.guild.id].paused = true;
                state[msg.guild.id].stream.pause();
                state[msg.guild.id].dispatcher.pause();
                msg.react("⏸️");
            }
        }
    },
    {
        name: "resume",
        description: "Resume the currently playing stream.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (state[msg.guild.id].playing) {
                state[msg.guild.id].paused = false;
                state[msg.guild.id].stream.resume();
                state[msg.guild.id].dispatcher.resume();
                msg.react("▶️");
            }
        }
    },
    {
        name: "stop",
        description: "Stop playback and clear the queue.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            state[msg.guild.id].queue = [];
            state[msg.guild.id].dispatcher.end();
            state[msg.guild.id].voiceChannel.leave();
            state[msg.guild.id].playing = false;
            state[msg.guild.id].paused = false;
            msg.react("🛑");
        }
    },
    {
        name: "skip",
        description: "Skip the current stream in the queue.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            state[msg.guild.id].dispatcher.end();
            msg.react("⏩");
        }
    },
    {
        name: "volume",
        description: "Set the volume. Value should be between 0 and 1. If no value is specified, displays the current volume.",
        argumentNames: ["<volume>?"],
        permissionLevel: "all",
        aliases: ["vol"],
        execute: async function(args, msg, bot) {
            if (args.length == 0) {
                msg.channel.send(`🔊 Current volume: ${state[msg.guild.id].dispatcher.volumeLogarithmic.toFixed(2)}`);
            } else {
                state[msg.guild.id].dispatcher.setVolumeLogarithmic(_.clamp(args[0], 0, bot.config.modules.player.servers[msg.guild.id].volumeLimit));
                msg.react("🔊");
            }
        }
    },
    {
        name: "shuffle",
        description: "Shuffle the queue.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            state[msg.guild.id].queue = _.shuffle(state[msg.guild.id].queue);
            msg.react("🔀");
        }
    },
    {
        name: "nowplaying",
        description: "Display the currently playing video.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: ["np"],
        execute: async function(args, msg, bot) {
            if (state[msg.guild.id].nowPlaying) {
                const embed = new discord.RichEmbed()
                    .setTitle(`Now Playing on ${state[msg.guild.id].voiceChannel.name}`)
                    .setColor(bot.config.defaultColors.neutral)
                    .setThumbnail(state[msg.guild.id].nowPlaying.thumbnail)
                    .setDescription(` **[${state[msg.guild.id].nowPlaying.title}](${state[msg.guild.id].nowPlaying.url})**\nenqueued by ${bot.util.username(state[msg.guild.id].nowPlaying.user)}\n`);
                msg.channel.send({embed});
            } else msg.channel.send("❌ Nothing is playing.");
        }
    },
    {
        name: "queue",
        description: "Display the queue.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            if (state[msg.guild.id].queue.length > 0) {
                const embed = new discord.RichEmbed()
                    .setTitle(`Queue for ${state[msg.guild.id].voiceChannel.name}`)
                    .setColor(bot.config.defaultColors.neutral)
                    .addField("Now Playing:", ` **[${state[msg.guild.id].nowPlaying.title}](${state[msg.guild.id].nowPlaying.url})**\n(enqueued by ${bot.util.username(state[msg.guild.id].nowPlaying.user)})`);
                var totalDuration = state[msg.guild.id].nowPlaying.duration;
                state[msg.guild.id].queue.forEach((item, i) => {
                    if (i < 24) embed.addField(`${i + 1}. ${item.title}`, `${item.url} (enqueued by ${bot.util.username(item.user)})`);
                    totalDuration += item.duration;
                })
                embed.setFooter(`${state[msg.guild.id].queue.length} in queue: total duration ${prettyMs(totalDuration * 1000)}`);
                msg.channel.send({embed});
            } else msg.channel.send("❌ Queue is empty.");
        }
    }
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
                thumbnail: info.thumbnail_url,
                duration: parseFloat(info.length_seconds),
                user: msg.author
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
            if (!state[msg.guild.id].playing) playNextQueuedVideo(msg, bot);
        }
    });
}

function playNextQueuedVideo(msg, bot) {
    const id = msg.guild.id;
    state[id].playing = true;
    // Connect to voice
    state[id].voiceChannel.join().then(connection => {
        state[id].nowPlaying = state[id].queue[0];
        state[id].queue.shift();
        state[id].stream = ytdl(state[id].nowPlaying.url, { filter: "audioonly" });
    	state[id].dispatcher = connection.playStream(state[id].stream);
        state[id].dispatcher.setVolumeLogarithmic(bot.config.modules.player.servers[id].defaultVolume);
        // Set stream end event
        state[id].dispatcher.once("end", reason => {
            if (state[id].queue.length > 0) {
                playNextQueuedVideo(msg, bot);
            } else {
                delete state[id].nowPlaying;
                state[id].playing = false;
                state[id].paused = false;
                state[id].voiceChannel.leave();
            }
    	});
    }).catch(err => {
        msg.channel.send(`❌ Error connecting to voice channel: ${err}`);
    });
}
