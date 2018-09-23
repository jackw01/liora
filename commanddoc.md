# Liora Discord Bot Command Documentation
6 modules, 65 commands<br>
Generated Sun Sep 23 2018 08:25:12 GMT-0700 (Pacific Daylight Time).

## Module `core`
#### info
`$info `  
Default permission level: `all`  
Get info on the bot.

#### help
`$help &lt;commandName&gt;?`  
Default permission level: `all`  
Get help on a command.

#### list
`$list &lt;module&gt;?`  
Default permission level: `all`  
List commands.

#### own
`$own `  
Default permission level: `all`  
Become the bot owner. This command can only be used once.

#### getconfig
`$getconfig &lt;itemPath&gt;`  
Default permission level: `owner`  
Default aliases: `cget`  
Get a configuration item.

#### setconfig
`$setconfig &lt;itemPath&gt; &lt;value&gt;`  
Default permission level: `owner`  
Default aliases: `cset`  
Set a configuration item.

#### kill
`$kill `  
Default permission level: `owner`  
Default aliases: `shutdown`  
Shutdown the bot.

#### restart
`$restart `  
Default permission level: `owner`  
Restart the bot.

#### reload
`$reload `  
Default permission level: `owner`  
Reload all modules.

#### loadmodule
`$loadmodule &lt;moduleName&gt;`  
Default permission level: `owner`  
Load a module.

#### reloadmodule
`$reloadmodule &lt;moduleName&gt;`  
Default permission level: `owner`  
Reload a module.

#### unloadmodule
`$unloadmodule &lt;moduleName&gt;`  
Default permission level: `owner`  
Unload a module.

#### permadd
`$permadd &lt;user&gt; &lt;group&gt;`  
Default permission level: `owner`  
Add a user (mention or name) to a permission group.

#### permremove
`$permremove &lt;user&gt; &lt;group&gt;`  
Default permission level: `owner`  
Remove a user (mention or name) from a permission group.

#### permgroups
`$permgroups `  
Default permission level: `owner`  
List permission groups

#### permlist
`$permlist &lt;group&gt;`  
Default permission level: `owner`  
List users in a permission group.

#### addgroupoverride
`$addgroupoverride &lt;command&gt; &lt;group&gt;`  
Default permission level: `owner`  
Add a group override for a command.

#### removegroupoverride
`$removegroupoverride &lt;command&gt;`  
Default permission level: `owner`  
Remove a group override for a command.

#### addroleoverride
`$addroleoverride &lt;command&gt; &lt;role&gt;`  
Default permission level: `owner`  
Add a role (mention or name) override for a command.

#### removeroleoverride
`$removeroleoverride &lt;command&gt;`  
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
`$alias &lt;alias&gt; &lt;command&gt;`  
Default permission level: `manager`  
Define an alias for a command.

#### removealias
`$removealias &lt;alias&gt;`  
Default permission level: `manager`  
Remove an alias for a command.

#### aliases
`$aliases `  
Default permission level: `all`  
List aliases.

## Module `utils`
#### serverinfo
`$serverinfo `  
Default permission level: `all`  
Get info for the current server.

#### userinfo
`$userinfo &lt;user&gt;?`  
Default permission level: `all`  
Default aliases: `userid`  
Get info for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### roleinfo
`$roleinfo &lt;role&gt;`  
Default permission level: `all`  
Default aliases: `roleid`  
Get the ID for a role mention or name

#### channelinfo
`$channelinfo &lt;channel&gt;`  
Default permission level: `all`  
Default aliases: `channelid`  
Get the ID for a channel mention or name

#### servericon
`$servericon `  
Default permission level: `all`  
Get the icon for the current server.

#### profilepic
`$profilepic &lt;user&gt;?`  
Default permission level: `all`  
Default aliases: `avatar`, `pfp`  
Get a profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### setnick
`$setnick &lt;newNickname&gt;`  
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
`$vote &lt;choiceNumber&gt;`  
Default permission level: `all`  
Vote in the current poll.

## Module `player`
#### ytsearch
`$ytsearch &lt;query&gt;`  
Default permission level: `all`  
Default aliases: `youtube`  
Display YouTube videos for a search query.

#### play
`$play &lt;query&gt;`  
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
`$volume &lt;volume&gt;?`  
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

## Module `search`
#### wikipedia
`$wikipedia &lt;query&gt;`  
Default permission level: `all`  
Default aliases: `wiki`  
Search Wikipedia.

#### redditimgsearch
`$redditimgsearch &lt;query&gt;`  
Default permission level: `all`  
Default aliases: `rimgsearch`  
Search imgur.com and i.redd.it image (not gif) links on Reddit and post one of the top results.

#### redditgifsearch
`$redditgifsearch &lt;query&gt;`  
Default permission level: `all`  
Default aliases: `rgifsearch`  
Search imgur.com, gfycat, and i.redd.it gif/v links on Reddit and post one of the top results.

#### redditimg
`$redditimg &lt;subreddit&gt; &lt;hour|day|week|month|year|all&gt;?`  
Default permission level: `all`  
Default aliases: `rimg`  
Get a image from the front page of a subreddit. Specify a time range to get an image from top posts.

#### redditgif
`$redditgif &lt;subreddit&gt; &lt;hour|day|week|month|year|all&gt;?`  
Default permission level: `all`  
Default aliases: `rgif`  
Get a gif or gifv from the front page of a subreddit.

#### urban
`$urban &lt;query&gt;`  
Default permission level: `all`  
Default aliases: `ud`  
Search Urban Dictionary for a word.

#### weather
`$weather &lt;cityName,countryCode&gt;`  
Default permission level: `all`  
Get current weather at a location.

#### xkcd
`$xkcd &lt;number&gt;?`  
Default permission level: `all`  
Show an xkcd comic. Gets the latest comic by default. Specify a number or 'random' to get a specific or random comic.

#### reverseimg
`$reverseimg `  
Default permission level: `all`  
Reverse image search the last posted image on the current channel or the image attached to the message with this command.

#### reverseprofilepic
`$reverseprofilepic &lt;user&gt;?`  
Default permission level: `all`  
Default aliases: `reverseavatar`, `reversepfp`  
Reverse image search the profile picture for a user mention, username, or nickname. If no user is mentioned, this command will use the user that triggered it.

#### translate
`$translate &lt;languageTo&gt; &lt;text&gt;`  
Default permission level: `all`  
Translate something to the specified language.

#### translatelast
`$translatelast &lt;languageTo&gt;`  
Default permission level: `all`  
Translate the last posted message on the current channel. Automatically detects the language of the last message.

## Module `autorespond`
#### addresponse
`$addresponse &lt;regex&gt; &lt;response&gt;`  
Default permission level: `manager`  
Add a regular expression and response to the autoresponder list. If multiple responses are added for one regex, one will be randomly selected. Use in a direct message with the bot to create a global response.

#### removeresponse
`$removeresponse &lt;regex&gt; &lt;index&gt;`  
Default permission level: `manager`  
Remove a response. Use in a direct message with the bot to remove a global response.

#### listresponses
`$listresponses `  
Default permission level: `manager`  
List responses. Use in a direct message with the bot to list global responses.

## Module `fun`
#### bigtext
`$bigtext &lt;text&gt;`  
Default permission level: `all`  
Generate large text with regional indicators.

#### dice
`$dice &lt;rolls&gt;? &lt;sides&gt;?`  
Default permission level: `all`  
Default aliases: `roll`  
Roll dice. If no arguments are given, will default to 1 d6.

#### 8ball
`$8ball &lt;question&gt;?`  
Default permission level: `all`  
Magic 8 ball.

#### fortune
`$fortune [all|computers|cookie|definitions|miscellaneous|people|platitudes|politics|science|wisdom]?`  
Default permission level: `all`  
Get a fortune.
