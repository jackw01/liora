module.exports.init = async function init(bot) {
};

module.exports.commands = [

  {
    name: 'potato',
    description: 'Ping.',
    argumentNames: [],
    permissionLevel: 'all',
    aliases: [],
    async execute(args, msg, bot) {
      msg.channel.send('potato.');
    },
  },
];
