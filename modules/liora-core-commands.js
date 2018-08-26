module.exports.init = async function(bot) {
}

module.exports.commands = {

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
