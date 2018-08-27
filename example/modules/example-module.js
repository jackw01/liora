module.exports.init = async function(bot) {
}

module.exports.commands = {

    "potato": {
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        execute: async function(args, msg, bot) {
            msg.channel.send("potato.");
        }
    }
}
