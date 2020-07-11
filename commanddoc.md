## Liora Discord Bot Command Documentation
6 modules, 70 commands
Generated Sun Sep 29 2019 18:17:48 GMT-0700 (Pacific Daylight Time).

### Table of Contents
* [core](#module-core)
* [utils](#module-utils)
* [search](#module-search)
* [autorespond](#module-autorespond)
* [fun](#module-fun)
* [player](#module-player)

### Module `core`
#### info
`$info `
Default permission level: `all`
Get info on the bot.

#### help
`$help <commandName>?`
Default permission level: `all`
Get help on a command.

#### list
`$list <module>?`
Default permission level: `all`
List commands.

#### own
`$own `
Default permission level: `all`
Become the bot owner. This command can only be used once.

#### getconfig
`$getconfig <itemPath>`
Default permission level: `owner`
Default aliases: `cget`
Get a configuration item.  Substitutes $GID for GUILD_ID and $GSET for .settings[GUILD_ID].

#### setconfig
`$setconfig <itemPath> <value>`
Default permission level: `owner`
Default aliases: `cset`
Set a configuration item. Substitutes $GID for GUILD_ID and $GSET for .settings[GUILD_ID].

#### restart
`$restart `
Default permission level: `owner`
Restart the bot.

#### reload
`$reload `
Default permission level: `owner`
Reload all modules.

#### loadmodule
`$loadmodule <moduleName>`
Default permission level: `owner`
Load a module.

#### reloadmodule
`$reloadmodule <moduleName>`
Default permission level: `owner`
Reload a module.

#### unloadmodule
`$unloadmodule <moduleName>`
Default permission level: `owner`
Unload a module.

#### permadd
`$permadd <user> <group>`
Default permission level: `owner`
Add a user (mention or name) to a permission group.

#### permremove
`$permremove <user> <group>`
Default permission level: `owner`
Remove a user (mention or name) from a permission group.

#### permgroups
`$permgroups `
Default permission level: `owner`
List permission groups

#### permlist
`$permlist <group>`
Default permission level: `owner`
List users in a permission group.

#### addgroupoverride
`$addgroupoverride <command> <group>`
Default permission level: `owner`
Add a group override for a command.

#### removegroupoverride
`$removegroupoverride <command>`
Default permission level: `owner`
Remove a group override for a command.

#### addroleoverride
`$addroleoverride <command> <role>`
Default permission level: `owner`
Add a role (mention or name) override for a command.

#### removeroleoverride
`$removeroleoverride <command>`
Default permission level: `owner`
Remove a role override for a command.

#### listoverrides
`$listoverrides `
Default permission level: `all`
List overrides.

#### ping
`$ping `
Default permission level: `all`
Ping.

#### alias
`$alias <alias> <command>`
Default permission level: `manager`
Define an alias for a command.

#### removealias
`$removealias <alias>`
Default permission level: `manager`
Remove an alias for a command.

#### aliases
`$aliases `
Default permission level: `all`
List aliases.

### Module `utils`
#### serverinfo
`$serverinfo `
Default permission level: `all`
Get info for the current server.

#### userinfo
`$userinfo <user>?`
Default permission level: `all`
Default aliases: `userid`
Get info for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### roleinfo
`$roleinfo <role>`
Default permission level: `all`
Default aliases: `roleid`
Get the ID for a role mention or name

#### channelinfo
`$channelinfo <channel>`
Default permission level: `all`
Default aliases: `channelid`
Get the ID for a channel mention or name

#### servericon
`$servericon `
Default permission level: `all`
Get the icon for the current server.

#### profilepic
`$profilepic <user>?`
Default permission level: `all`
Default aliases: `avatar`, `pfp`
Get a profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### setnick
`$setnick <newNickname>`
Default permission level: `manager`
Set nickname.

#### poll
`$poll "question" "answer-1" "answer-n"`
Default permission level: `all`
Create a poll on the current channel.

#### polldata
`$polldata `
Default permission level: `all`
View poll data on the current channel without ending the poll.

#### endpoll
`$endpoll `
Default permission level: `all`
End the poll on the current channel.

#### vote
`$vote <choiceNumber>`
Default permission level: `all`
Vote in the current poll.

#### recall
`$recall `
Default permission level: `all`
Recall the last 25 deleted messages in the current channel.

#### snipe
`$snipe <user>?`
Default permission level: `all`
Recall the last deleted message in the current channel. If a user mention, username, or nickname is supplied, the last deleted message from that user will be shown.

#### recalledits
`$recalledits `
Default permission level: `all`
Default aliases: `edits`
Recall the old message versions from the last 25 message edits in the current channel.

#### lastedit
`$lastedit `
Default permission level: `all`
Default aliases: `esnipe`
Recall the old message versions from the last edited message in the current channel.

### Module `search`
#### wikipedia
`$wikipedia <query>`
Default permission level: `all`
Default aliases: `wiki`
Search Wikipedia.

#### redditimgsearch
`$redditimgsearch <query>`
Default permission level: `all`
Default aliases: `rimgsearch`
Search imgur.com and i.redd.it image (not gif) links on Reddit and post one of the top results.

#### redditgifsearch
`$redditgifsearch <query>`
Default permission level: `all`
Default aliases: `rgifsearch`
Search imgur.com, gfycat, and i.redd.it gif/v links on Reddit and post one of the top results.

#### redditimg
`$redditimg <subreddit> <hour|day|week|month|year|all>?`
Default permission level: `all`
Default aliases: `rimg`
Get a image from the front page of a subreddit. Specify a time range to get an image from top posts.

#### redditgif
`$redditgif <subreddit> <hour|day|week|month|year|all>?`
Default permission level: `all`
Default aliases: `rgif`
Get a gif or gifv from the front page of a subreddit.

#### imgur
`$imgur <subreddit> <hour|day|week|month|year|all>?`
Default permission level: `all`
Get a recent image from Imgur, filtered by subreddit. Does not show images based on Reddit votes and does not provide a link to Reddit comments. Specify a time range to get an image from top posts.

#### urban
`$urban <query>`
Default permission level: `all`
Default aliases: `ud`
Search Urban Dictionary for a word.

#### weather
`$weather <cityName,countryCode>`
Default permission level: `all`
Get current weather at a location.

#### xkcd
`$xkcd <number>?`
Default permission level: `all`
Show an xkcd comic. Gets the latest comic by default. Specify a number or 'random' to get a specific or random comic.

#### reverseimg
`$reverseimg `
Default permission level: `all`
Reverse image search the last posted image on the current channel or the image attached to the message with this command.

#### reverseprofilepic
`$reverseprofilepic <user>?`
Default permission level: `all`
Default aliases: `reverseavatar`, `reversepfp`
Reverse image search the profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### translate
`$translate <languageTo> <text>`
Default permission level: `all`
Translate something to the specified language.

#### translatelast
`$translatelast <languageTo>`
Default permission level: `all`
Translate the last posted message on the current channel. Automatically detects the language of the last message.

### Module `autorespond`
#### addresponse
`$addresponse <regex> <response>`
Default permission level: `manager`
Add a regular expression and response to the autoresponder list. If multiple responses are added for one regex, one will be randomly selected. Use in a direct message with the bot to create a global response.

#### removeresponse
`$removeresponse <regex> <index>`
Default permission level: `manager`
Remove a response. Use in a direct message with the bot to remove a global response.

#### listresponses
`$listresponses `
Default permission level: `manager`
List responses. Use in a direct message with the bot to list global responses.

### Module `fun`
#### bigtext
`$bigtext <text>`
Default permission level: `all`
Generate large text with regional indicators.

#### dice
`$dice <rolls>? <sides>?`
Default permission level: `all`
Default aliases: `roll`
Roll dice. If no arguments are given, will default to 1 d6.

#### 8ball
`$8ball <question>?`
Default permission level: `all`
Magic 8 ball.

#### fortune
`$fortune [all|computers|cookie|definitions|miscellaneous|people|platitudes|politics|science|wisdom]?`
Default permission level: `all`
Get a fortune.

### Module `player`
#### ytsearch
`$ytsearch <query>`
Default permission level: `all`
Default aliases: `youtube`
Display YouTube videos for a search query.

#### play
`$play <query>`
Default permission level: `all`
Play a YouTube video based on a search query or URL.

#### pause
`$pause `
Default permission level: `all`
Pause the currently playing stream.

#### resume
`$resume `
Default permission level: `all`
Resume the currently playing stream.

#### stop
`$stop `
Default permission level: `all`
Stop playback and clear the queue.

#### skip
`$skip `
Default permission level: `all`
Skip the current stream in the queue.

#### volume
`$volume <volume>?`
Default permission level: `all`
Default aliases: `vol`
Set the volume. Value should be between 0 and 1. If no value is specified, displays the current volume.

#### shuffle
`$shuffle `
Default permission level: `all`
Shuffle the queue.

#### nowplaying
`$nowplaying `
Default permission level: `all`
Default aliases: `np`
Display the currently playing video.

#### queue
`$queue `
Default permission level: `all`
Display the queue.

