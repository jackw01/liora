module.exports.init = async function(bot) {
}

module.exports.commands = {

    "own": {
        description: "Become the bot owner. This command can only be used once.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            if (!bot.config["owner"]) {
                bot.config["owner"] = msg.author.id;
                bot.saveConfig(err => {
                    if (err) msg.channel.send(`❌ Error saving config file: ${err.message}`);
                    else msg.channel.send("✅ Success!");
                });
            }
        }
    },

    "ping": {
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            const m = await msg.channel.send("pong");
            msg.channel.send(`ℹ️ Socket heartbeat ping is ${Math.round(bot.client.ping)}ms. Message RTT is ${m.createdTimestamp - msg.createdTimestamp}ms.`);
            m.delete();
        }
    }
}
