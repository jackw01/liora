# Liora Discord Bot Command Documentation
6 modules, 65 commands<br>
Generated Fri Sep 21 2018 22:16:01 GMT-0700 (Pacific Daylight Time).

## Module `core`
#### info
`$info `<br>
Default permission level: `all`<br>
Get info on the bot.

#### help
`$help <commandName>?`<br>
Default permission level: `all`<br>
Get help on a command.

#### list
`$list <module>?`<br>
Default permission level: `all`<br>
List commands.

#### own
`$own `<br>
Default permission level: `all`<br>
Become the bot owner. This command can only be used once.

#### getconfig
`$getconfig <itemPath>`<br>
Default permission level: `owner`<br>
Default aliases: `cget`<br>
Get a configuration item.

#### setconfig
`$setconfig <itemPath> <value>`<br>
Default permission level: `owner`<br>
Default aliases: `cset`<br>
Set a configuration item.

#### kill
`$kill `<br>
Default permission level: `owner`<br>
Default aliases: `shutdown`<br>
Shutdown the bot.

#### restart
`$restart `<br>
Default permission level: `owner`<br>
Restart the bot.

#### reload
`$reload `<br>
Default permission level: `owner`<br>
Reload all modules.

#### loadmodule
`$loadmodule <moduleName>`<br>
Default permission level: `owner`<br>
Load a module.

#### reloadmodule
`$reloadmodule <moduleName>`<br>
Default permission level: `owner`<br>
Reload a module.

#### unloadmodule
`$unloadmodule <moduleName>`<br>
Default permission level: `owner`<br>
Unload a module.

#### permadd
`$permadd <user> <group>`<br>
Default permission level: `owner`<br>
Add a user (mention or name) to a permission group.

#### permremove
`$permremove <user> <group>`<br>
Default permission level: `owner`<br>
Remove a user (mention or name) from a permission group.

#### permgroups
`$permgroups `<br>
Default permission level: `owner`<br>
List permission groups

#### permlist
`$permlist <group>`<br>
Default permission level: `owner`<br>
List users in a permission group.

#### addgroupoverride
`$addgroupoverride <command> <group>`<br>
Default permission level: `owner`<br>
Add a group override for a command.

#### removegroupoverride
`$removegroupoverride <command>`<br>
Default permission level: `owner`<br>
Remove a group override for a command.

#### addroleoverride
`$addroleoverride <command> <role>`<br>
Default permission level: `owner`<br>
Add a role (mention or name) override for a command.

#### removeroleoverride
`$removeroleoverride <command>`<br>
Default permission level: `owner`<br>
Remove a role override for a command.

#### listoverrides
`$listoverrides `<br>
Default permission level: `all`<br>
List overrides.

#### ping
`$ping `<br>
Default permission level: `all`<br>
Ping.

#### alias
`$alias <alias> <command>`<br>
Default permission level: `manager`<br>
Define an alias for a command.

#### removealias
`$removealias <alias>`<br>
Default permission level: `manager`<br>
Remove an alias for a command.

#### aliases
`$aliases `<br>
Default permission level: `all`<br>
List aliases.

## Module `utils`
#### serverinfo
`$serverinfo `<br>
Default permission level: `all`<br>
Get info for the current server.

#### userinfo
`$userinfo <user>?`<br>
Default permission level: `all`<br>
Default aliases: `userid`<br>
Get info for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### roleinfo
`$roleinfo <role>`<br>
Default permission level: `all`<br>
Default aliases: `roleid`<br>
Get the ID for a role mention or name

#### channelinfo
`$channelinfo <channel>`<br>
Default permission level: `all`<br>
Default aliases: `channelid`<br>
Get the ID for a channel mention or name

#### servericon
`$servericon `<br>
Default permission level: `all`<br>
Get the icon for the current server.

#### profilepic
`$profilepic <user>?`<br>
Default permission level: `all`<br>
Default aliases: `avatar`, `pfp`<br>
Get a profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### setnick
`$setnick <newNickname>`<br>
Default permission level: `manager`<br>
Set nickname.

#### poll
`$poll "question" "answer-1" "answer-n"`<br>
Default permission level: `all`<br>
Create a poll on the current channel.

#### polldata
`$polldata `<br>
Default permission level: `all`<br>
View poll data on the current channel without ending the poll.

#### endpoll
`$endpoll `<br>
Default permission level: `all`<br>
End the poll on the current channel.

#### vote
`$vote <choiceNumber>`<br>
Default permission level: `all`<br>
Vote in the current poll.

## Module `player`
#### ytsearch
`$ytsearch <query>`<br>
Default permission level: `all`<br>
Default aliases: `youtube`<br>
Display YouTube videos for a search query.

#### play
`$play <query>`<br>
Default permission level: `all`<br>
Play a YouTube video based on a search query or URL.

#### pause
`$pause `<br>
Default permission level: `all`<br>
Pause the currently playing stream.

#### resume
`$resume `<br>
Default permission level: `all`<br>
Resume the currently playing stream.

#### stop
`$stop `<br>
Default permission level: `all`<br>
Stop playback and clear the queue.

#### skip
`$skip `<br>
Default permission level: `all`<br>
Skip the current stream in the queue.

#### volume
`$volume <volume>?`<br>
Default permission level: `all`<br>
Default aliases: `vol`<br>
Set the volume. Value should be between 0 and 1. If no value is specified, displays the current volume.

#### shuffle
`$shuffle `<br>
Default permission level: `all`<br>
Shuffle the queue.

#### nowplaying
`$nowplaying `<br>
Default permission level: `all`<br>
Default aliases: `np`<br>
Display the currently playing video.

#### queue
`$queue `<br>
Default permission level: `all`<br>
Display the queue.

## Module `search`
#### wikipedia
`$wikipedia <query>`<br>
Default permission level: `all`<br>
Default aliases: `wiki`<br>
Search Wikipedia.

#### redditimgsearch
`$redditimgsearch <query>`<br>
Default permission level: `all`<br>
Default aliases: `rimgsearch`<br>
Search imgur.com and i.redd.it image (not gif) links on Reddit and post one of the top results.

#### redditgifsearch
`$redditgifsearch <query>`<br>
Default permission level: `all`<br>
Default aliases: `rgifsearch`<br>
Search imgur.com, gfycat, and i.redd.it gif/v links on Reddit and post one of the top results.

#### redditimg
`$redditimg <subreddit> <hour|day|week|month|year|all>?`<br>
Default permission level: `all`<br>
Default aliases: `rimg`<br>
Get a image from the front page of a subreddit. Specify a time range to get an image from top posts.

#### redditgif
`$redditgif <subreddit> <hour|day|week|month|year|all>?`<br>
Default permission level: `all`<br>
Default aliases: `rgif`<br>
Get a gif or gifv from the front page of a subreddit.

#### urban
`$urban <query>`<br>
Default permission level: `all`<br>
Default aliases: `ud`<br>
Search Urban Dictionary for a word.

#### weather
`$weather <cityName,countryCode>`<br>
Default permission level: `all`<br>
Get current weather at a location.

#### xkcd
`$xkcd <number>?`<br>
Default permission level: `all`<br>
Show an xkcd comic. Gets the latest comic by default. Specify a number or 'random' to get a specific or random comic.

#### reverseimg
`$reverseimg `<br>
Default permission level: `all`<br>
Reverse image search the last posted image on the current channel or the image attached to the message with this command.

#### reverseprofilepic
`$reverseprofilepic <user>?`<br>
Default permission level: `all`<br>
Default aliases: `reverseavatar`, `reversepfp`<br>
Reverse image search the profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### translate
`$translate <languageTo> <text>`<br>
Default permission level: `all`<br>
Translate something to the specified language.

#### translatelast
`$translatelast <languageTo>`<br>
Default permission level: `all`<br>
Translate the last posted message on the current channel. Automatically detects the language of the last message.

## Module `autorespond`
#### addresponse
`$addresponse <regex> <response>`<br>
Default permission level: `manager`<br>
Add a regular expression and response to the autoresponder list. If multiple responses are added for one regex, one will be randomly selected. Use in a direct message with the bot to create a global response.

#### removeresponse
`$removeresponse <regex> <index>`<br>
Default permission level: `manager`<br>
Remove a response. Use in a direct message with the bot to remove a global response.

#### listresponses
`$listresponses `<br>
Default permission level: `manager`<br>
List responses. Use in a direct message with the bot to list global responses.

## Module `fun`
#### bigtext
`$bigtext <text>`<br>
Default permission level: `all`<br>
Generate large text with regional indicators.

#### dice
`$dice <rolls>? <sides>?`<br>
Default permission level: `all`<br>
Default aliases: `roll`<br>
Roll dice. If no arguments are given, will default to 1 d6.

#### 8ball
`$8ball <question>?`<br>
Default permission level: `all`<br>
Magic 8 ball.

#### fortune
`$fortune [all|computers|cookie|definitions|miscellaneous|people|platitudes|politics|science|wisdom]?`<br>
Default permission level: `all`<br>
Get a fortune.

