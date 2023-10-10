# Deprecated
This framework isn't being maintained anymore and can only be used for Discord.js version 13.x

# Giveaways
[![downloadsBadge](https://img.shields.io/npm/dt/giveaways?style=for-the-badge)](https://npmjs.com/package/giveaways)
[![versionBadge](https://img.shields.io/npm/v/giveaways?style=for-the-badge)](https://npmjs.com/package/giveaways)
[![documentationBadge](https://img.shields.io/badge/Documentation-Click%20here-blue?style=for-the-badge)](https://github.com/Luuk-Dev/Giveaways#readme)

Giveaways is a NodeJS framework for your Discord.js bot to easily create a giveaway command.

## Why giveaways?
Giveaways is a stable framework and easy to understand. By restarting the bot the giveaways will continue working once the bot started and if the time of the giveaway passed while the bot was offline, the winners will immediately get announced once the bot is online again.

## Starting
Before creating a giveaway you'll have to pass the client to the framework. This is required to get channels from the giveaways and fetch the message if need to. You can do this by using the ClientManager class.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);
```

## Creating a giveaway
You can create a giveaway by using the Giveaway class. The class requires a channel to send the giveaway message and has a lot of options.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

const channel = client.channels.cache.get('01234567890');
new Giveaway(channel)
.setPrize(`Discord Nitro`) // Create a price
.setTop(`Nitro`, `https://www.extive.eu/assets/img/discord_nitro.png`) // Sets the top title and image
.setTag(`@everyone`) // Sets the tag. Can be a role id or a string like '@everyone'.
.setDescription(`**NEW NITRO GIVEAWAY!**`) // Set the description for the giveaway embed
.setEndDescription(`**NITRO GIVEAWAY ENDED!**`) // Sets the description for the giveaway embed once the giveaway got ended
.setBeginColor(`#a84432`) // Set the color of the embed if the giveaway is still going on
.setEndColor(`#428af5`) // Set the color of the embed if the giveaway ended
.setHostedBy(message.member.id) // Sets who hosts the giveaway
.setInterval(`10 seconds`) // Sets the interval for updating the giveaway embed
.setTime(`2 days`) // How long the giveaway takes
.setFooter(`Join the Nitro giveaway!`) // Sets the footer of the giveaway embed
.addSettings({winners: 1, bots: false}) // Sets custom settings to the giveaway
.addTimestamp() // Adds a timestamp to the giveaway embed
.setThumbnail(`https://www.extive.eu/assets/img/extive.png`) // Sets the thumbnail of the giveaway embed
.setImage(`https://www.extive.eu/assets/img/discord_nitro_banner.png`) // Sets the image of the giveaway embed
.send().then(() => { // Starts the giveaway
    console.log(`Giveaway started`);
}).catch(err => console.log(err));
```
Output:

![Output example](https://www.extive.eu/assets/img/npm_giveaways_preview_1.png)

## Rerolling a giveaway
You can reroll a giveaway by using the earlier created ClientManager. It has a reroll function in it. You are required to include the message id of the giveaway.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

manager.reroll('01234567890').then(() => {
    console.log(`Is it really this easy? Yes it is.`);
}).catch(err => console.log(err));
```

## Ending a giveaway
You can end a giveaway before the timer got ended. Just like the reroll function you'll have to use the ClientManager for this action.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

manager.end('01234567890').then(() => {
    console.log(`Is it really this easy? Yes it is.`);
}).catch(err => console.log(err));
```

## Removing a giveaway
You can also remove a giveaway (including the message). Just like the reroll and end function you'll have to use the ClientManager for this action.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

manager.remove('01234567890').then(() => {
    console.log(`Is it really this easy? Yes it is.`);
}).catch(err => console.log(err));
```

## Custom storage
By default the giveaways will be saved in the `./data/giveaways.json` file in the data folder in the giveaways module folder. You can change this by using the setCustomStorage function in the ClientManager class.
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);
manager.setCustomStorage(`/giveaways.json`);
```
In this example the storage location has been changed to a file named `/giveaways.json`. It is required to put an array in the file which you want to use as custom storage.

## Event listeners
There are also different event listeners. In the following example we'll show them all and explain where they're listening to.
### ClientManager event listeners
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

manager.on('pass', () => { // Gets called once the client gets passed to the ClientManager class.
    console.log(`Client has been passed`);
});
manager.on('end', messageid => { // Gets called if a giveaway ends with the id of the giveaway message
    console.log(`The giveaway with the message id ${messageid} has ended`);
});
manager.on('start', (messageid, channelid) => { // Gets called if a giveaway started with the id of the giveaway message and the id of the channel where the giveaway is beïng held.
    console.log(`A giveaway with the message id ${messageid} has been started in the channel with the id ${channelid}`);
});
manager.on('update', () => { // Gets called once the storage location changes
    console.log(`The storage has been changed`);
});
manager.on('reroll', messageid => { // Gets called once a giveaway gets rerolled with the id of the giveaway message
    console.log(`The giveaway with the message id ${messageid} has been rerolled`);
});
```
### Giveaway event listeners
```js
const {Giveaway, ClientManager} = require('giveaways');
const Discord = require('discord.js');
const client = new Discord.Client();

const manager = new ClientManager(client);

const channel = client.channels.cache.get('01234567890');
const giveaway = new Giveaway(channel);

giveaway.on('create', () => { // Gets called once a giveaway gets created
    console.log(`A new giveaway has been created`);
});
```

### Credits:
Written by the [Extive](https://www.extive.eu/discord) developers

Management by Luuk
