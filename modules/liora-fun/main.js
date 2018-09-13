const discord = require("discord.js");
const commandExists = require("command-exists");
const cp = require("child_process");

const magic8Ball = [
    "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes - definitely.", "You may rely on it.",
    "As I see it, yes.", "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.", "Reply hazy, try again",
    "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
    "Don't count on it.", "My reply is no.", "My sources say no", "Outlook not so good.", "Very doubtful."
];

const fortuneFiles = [
    "all", "computers", "cookie", "definitions", "miscellaneous", "people", "platitudes", "politics",
    "science", "wisdom"
];

module.exports.init = async function(bot) {
    if (!commandExists.sync("fortune")) {
        bot.log.modinfo("Fun: fortune command disabled - make sure that fortune is installed and in path.");
        module.exports.commands = module.exports.commands.filter(c => c.name != "fortune");
    }
}

module.exports.commands = [
    {
        name: "dice",
        description: "Roll dice. If no arguments are given, will default to 1 d6.",
        argumentNames: ["<rolls>?", "<sides>?"],
        permissionLevel: "all",
        aliases: ["roll"],
        execute: async function(args, msg, bot) {
            let rolls, sides;
            if (args.length == 0) {
                rolls = 1;
                sides = 6;
            } else if (args.length == 1) {
                bot.sendError(msg.channel, `Please specify either zero or two arguments. See help for more info.`);
                return;
            } else {
                rolls = args[0];
                sides = args[1];
            }
            const out = [];
            for (var i = 0; i < rolls; i++) out.push(randomIntInRange(1, sides));
            const embed = new discord.RichEmbed()
                .setTitle("Dice Roll Result")
                .setColor(bot.config.defaultColors.success)
                .addField(`${rolls}d${sides}`, out.join(", "));
            msg.channel.send({embed});
        }
    },
    {
        name: "8ball",
        description: "Magic 8 ball.",
        argumentNames: ["<question>?"],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const embed = new discord.RichEmbed()
                .setTitle(`🎱 ${args.join(" ")}`)
                .setColor(bot.config.defaultColors.success)
                .setDescription(`${magic8Ball[randomIntInRange(0, magic8Ball.length - 1)]}`)
            msg.channel.send({embed});
        }
    },
    {
        name: "fortune",
        description: "Get a fortune.",
        argumentNames: [`[${fortuneFiles.join("|")}]?`],
        permissionLevel: "all",
        aliases: [],
        execute: async function(args, msg, bot) {
            const file = args.length == 0 ? "wisdom" : args[0];
            if (fortuneFiles.includes(file)) {
                cp.exec(`fortune -s ${file}`, (err, stdout, stderr) => {
                    if (err) {
                        msg.channel.send(`❌ Error running fortune`);
                    } else {
                        const embed = new discord.RichEmbed()
                            .setTitle("Fortune")
                            .setColor(bot.config.defaultColors.success)
                            .setDescription(stdout);
                        msg.channel.send({embed});
                    }
                });
            } else {
                bot.sendError(msg.channel, `Fortune file not valid.`, `Choose from \`${fortuneFiles.join("`, `")}\``);
            }
        }
    }
]

// Inclusive random integer in range
function randomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}
