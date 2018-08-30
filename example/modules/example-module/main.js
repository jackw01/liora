module.exports.init = async function(bot) {
}

module.exports.commands = [

    {
        name: "potato"
        description: "Ping.",
        argumentNames: [],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            msg.channel.send("potato.");
        }
    }
]
