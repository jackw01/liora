# Liora Example Usage
This guide assumes that you have created an application for your bot at https://discordapp.com/developers/applications/ and obtained a bot token, and added the bot to your server(s). There are many good guides out there already.

1. Run `npm install` in this folder to install dependencies.
2. Run `node .` to run using the default configuration folder at `~/.liora-bot/` or run `node . --configDir .` to use the current folder as the configuration folder.
4. The `config.json` file inside the config folder will open. Paste your bot token into the `discordToken` property.
5. Run `node .` again to connect to Discord.

To use the `test` command in `example-module`, load the module by running `$loadmodule example-module` in a Discord channel with the bot. Then run `$test`.
