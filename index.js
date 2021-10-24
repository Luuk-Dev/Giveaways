var giveaways = require('./data/giveaways.json');
var ended = require('./data/ended.json');
const ms = require('ms');
const fs = require('fs');
const {EventEmitter} = require('events');
const {ValueSaver} = require('valuesaver');
const path = require('path');
const Discord = require('discord.js');

const getgiveaways = new ValueSaver();
const intervals = new ValueSaver();
const forceend = new ValueSaver();
const endedGiveaways = new ValueSaver();
const globals = {};
const messages = {};

var botclient = null;

const week = 1000 * 60 * 60 * 24 * 7;

var storage = path.join(__dirname, `./data/giveaways.json`);

const oldgiveaways = ended.filter(giveaway => giveaway.timestamp + week < new Date().getTime());

oldgiveaways.forEach(giveaway => {
  const index = ended.indexOf(giveaway);
  ended.splice(index, 1);
});

if(oldgiveaways.length > 0){
  fs.writeFileSync(path.join(__dirname, `./data/ended.json`), JSON.stringify(ended));
}

const wait = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
const discordversion = Number(Discord.version.split(".")[0]);
if(discordversion < 12) throw new Error(`The giveaways package is not supported for Discord.js version lower than 12`);

(async () => {
    do {
        await wait(100);
    } while (botclient === null);

    function openGiveaways(){
        giveaways.forEach(giveaway => {
            const chan = botclient.channels.cache.get(giveaway.channelid);
            if(!chan) return;
            chan.messages.fetch(giveaway.messageid).then(msg => {
              globals[giveaway.messageid] = new ValueSaver(giveaway.globals);
              globals[giveaway.messageid].set(`embed`, new Discord.MessageEmbed(globals[giveaway.messageid].get(`embed`)));
              globals[giveaway.messageid].set(`channel`, giveaway.channelid);
              if(Boolean(globals[giveaway.messageid].get(`ended`)) === false) updateMessage(giveaway.enddate, msg);
              getgiveaways.set(giveaway.messageid, 1);
            }).catch(err => {});

        });
        ended.forEach(end => {
          endedGiveaways.set(end.messageid, new ValueSaver(end.globals));
        });
    }

    if(typeof botclient?.isReady === 'function'){
        if(botclient.isReady()) openGiveaways();
      	else botclient.once('ready', () => openGiveaways());
    } else openGiveaways();
})();

const updateMessage = (enddate, message) => {
    var interval = setInterval(async () => {
        if(!intervals.get(message.id)) intervals.set(message.id, interval);
        if(Boolean(globals[message.id].get(`ended`)) === true){
          clearInterval(interval);
          return;
        }
        var content = ``;
        if(globals[message.id].get(`tag`)) content = globals[message.id].get(`tag`);
        if(globals[message.id].get(`description`)){
        if(content.length > 0){
            content += `\n${globals[message.id].get(`description`)}`;
        } else content = globals[message.id].get(`description`);
        }
        const now = new Date().getTime();
        const diffTime = enddate - now;
        if(diffTime <= 0 || forceend.get(message.id)){
            clearInterval(interval);
            var winners;
            if(globals[message.id].get(`settings`)['bots'] === false){
                winners = (await message.reactions.resolve(`🎉`).users.fetch()).filter(m => m.bot === false).random(globals[message.id].get(`settings`)['winners']);
            } else {
                winners = (await message.reactions.resolve(`🎉`).users.fetch()).random(globals[message.id].get(`settings`)['winners']);
            }
            globals[message.id].set(`embed`, globals[message.id].get(`embed`).setColor(globals[message.id].get(`endcolor`)));
            if(winners.length === 0){
                globals[message.id].set(`embed`, globals[message.id].get(`embed`).setDescription(`**Giveaway ended!**\nHosted by: ${globals[message.id].get(`hostedby`)}\n\nWinner(s): There were no winners`));
                if(discordversion === 12){
                    if(globals[message.id].get(`enddescription`)) message.edit(globals[message.id].get(`enddescription`), globals[message.id].get(`embed`)).catch(err => {});
                    else message.edit(`**Giveaway Ended**`, globals[message.id].get(`embed`)).catch(err => {});
                } else if(discordversion === 13){
                    if(globals[message.id].get(`enddescription`)) message.edit({'content': globals[message.id].get(`enddescription`), embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
                    else message.edit({'content': `**Giveaway Ended**`, embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
                }
                return;
            } else {
                winners = winners.reduce((total, value) => {
                    message.channel.send(`Congrats, <@!${value.id}>! You've won **${globals[message.id].get(`prize`)}**`);
                    if(total === ``) return total += `<@!${value.id}>`;
                    else return total += `\n<@!${value.id}>`;
                }, ``);
                globals[message.id].set(`embed`, globals[message.id].get(`embed`).setDescription(`**Giveaway ended!**\nHosted by: ${globals[message.id].get(`hostedby`)}\n\nWinner(s): ${winners}`));
                if(discordversion === 12){
                    if(globals[message.id].get(`enddescription`)) message.edit(globals[message.id].get(`enddescription`), globals[message.id].get(`embed`)).catch(err => {});
                    else message.edit(`**Giveaway Ended**`, globals[message.id].get(`embed`)).catch(err => {});
                } else if(discordversion === 13){
                    if(globals[message.id].get(`enddescription`)) message.edit({'content': globals[message.id].get(`enddescription`), embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
                    else message.edit({'content': `**Giveaway Ended**`, embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
                }
                globals[message.id].set(`ended`, 1);
                ended.push({
                  messageid: message.id,
                  timestamp: new Date().getTime(),
                  globals: globals[message.id].toReadableArray()
                });
                fs.writeFileSync(path.join(__dirname, `./data/ended.json`), JSON.stringify(ended));
                const filter = giveaways.filter(g => g.messageid === message.id);
                if(filter.length > 0){
                  const index = giveaways.indexOf(filter[0]);
                  if(index >= 0){
                    giveaways.splice(index, 1);
                    fs.writeFileSync(storage, JSON.stringify(giveaways));
                  }
                }
                onEnd.emit('end', message.id);
                return;
            }
        } else {
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          var endsin = ``;

          var Days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          var Hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          var Minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
          var Seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

          if(diffDays > 0) endsin = `Ends in ${Days} ${days > 1 ? 'days' : 'day'} and ${Hours} ${Hours > 1 || Hours === 0 ? 'hours' : 'hour'}`;
          else {
              endsin = `Ends today in ${Hours} ${Hours > 1 || Hours === 0 ? 'hours' : 'hour'} ${Minutes} ${Minutes > 1 || Minutes === 0 ? 'minutes' : 'minute'} and ${Seconds} ${Seconds > 1 || Seconds === 0 ? 'seconds' : 'second'}`;
          }
          const hostedby = globals[message.id].get(`hostedby`);
          globals[message.id].set(`embed`, globals[message.id].get(`embed`).setDescription(`React with ${globals[message.id].get(`reaction`)} to participate!${hostedby ? `\nHosted by: ${hostedby}` : ``}\n${globals[message.id].get(`settings`)['winners']} winner(s)\n\n${endsin}`));

          if(discordversion === 12){
              if(content.length > 0) message.edit(content, globals[message.id].get(`embed`)).catch(err => {});
              else message.edit(globals[message.id].get(`embed`)).catch(err => {});
          } else if(discordversion === 13){
              if(content.length > 0) message.edit({'content': content, embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
              else message.edit({embeds: [globals[message.id].get(`embed`)]}).catch(err => {});
          }
        }
    }, ms(typeof globals[message.id].get(`interval`) === 'string' ? globals[message.id].get(`interval`) : ms(globals[message.id].get(`interval`))));
};

const onEnd = new EventEmitter();

class ClientManager extends EventEmitter{
    constructor(client){
        if(typeof client === 'undefined' || client === undefined || client === "") throw new Error(`Client is required`);

        super();
        botclient = client;

        setTimeout(() => this.emit(`pass`), 500);
        
        onEnd.on('end', giveaway => {
            this.emit(`end`, giveaway);
        });

        onEnd.on('start', (messageid, channelid) => {
            this.emit(`start`, messageid, channelid);
        });
    }
    setCustomStorage(location = path.join(__dirname, `./data/giveaways.json`)){
        storage = String(location);
        giveaways = require(storage);

        this.emit(`update`);
    }
    reroll(messageid){
      return new Promise((resolve, reject) => {
        if(!messageid) return reject(new Error(`A message id is required`));
        if(!endedGiveaways.get(messageid)) return reject(new Error(`Giveaway doesn't exists or is still going on!`));
        const chan = botclient.channels.cache.get(endedGiveaways.get(messageid).get(`channel`));
        if(!chan) return reject(new Error(`Channel was not found!`));
        chan.messages.fetch(messageid).then(async message => {
          var winners;
          if(endedGiveaways.get(message.id).get(`settings`)['bots'] === false){
            winners = (await message.reactions.resolve(`🎉`).users.fetch()).filter(m => m.bot === false).random(endedGiveaways.get(messageid).get(`settings`)['winners']);
          } else {
            winners = (await message.reactions.resolve(`🎉`).users.fetch()).random(endedGiveaways.get(messageid).get(`settings`)['winners']);
          }
          if(winners.length === 0){
            reject(new Error(`There are no participants!`));
          } else {
            winners = winners.reduce((total, value) => {
              return total += ` <@!${value.id}>`;
            }, ``);
            chan.send(`New winner(s):${winners}! Congrats! You've won **${endedGiveaways.get(messageid).get(`prize`)}**!`);
            this.emit(`reroll`, messageid);
            resolve();
          }
        }).catch(err => {
          return reject(new Error(`Couldn't reroll giveaway due the following reason: ${err}`));
        });
      });
    }
    end(messageid){
      return new Promise((resolve, reject) => {
        if(!messageid) return reject(new Error(`A message id is required`));
        if(!globals[String(messageid)]) return reject(new Error(`Giveaway doesn't exists or has already been ended!`));
        forceend.set(messageid, 1);
        resolve();
      });
    }
    remove(messageid){
      return new Promise((resolve, reject) => {
        if(!messageid) return reject(new Error(`A message id is required`));
        if(!endedGiveaways.get(messageid)) return reject(new Error(`Giveaway doesn't exists or is still going on!`));
        if(!intervals.get(String(messageid))) return reject(new Error(`Giveaway couldn't be found!`));
        clearInterval(intervals.get(String(messageid)));
        const chan = botclient.channels.cache.get(endedGiveaways.get(messageid).get(`channel`));
        if(!chan) return resolve();
        chan.messages.fetch(messageid).then(msg => {
          msg.delete();
          const filter = ended.filter(g => g.messageid === messageid);
          if(filter.length > 0){
            const index = ended.indexOf(filter[0]);
            if(index >= 0){
              ended.splice(index, 1);
              fs.writeFileSync(path.join(__dirname, `./data/ended.json`), JSON.stringify(ended));
              this.emit(`remove`, messageid);
            }
          }
          resolve();
        }).catch(err => {
          reject(new Error(err));
        });
      });
    }
};

class Giveaway extends EventEmitter{
  constructor(channel){
    if(typeof channel === 'undefined' || channel === undefined || channel === '') throw new Error(`Channel is required`);
    if(botclient === null) throw new Error(`The client manager hasn't been created yet`);

    super();
    
    this.channel = channel;
    if(globals[this.channel.id]) throw new Error(`There has already been made another giveaway for this channel which hasn't been send yet! Please send or remove the giveaway before creating a new one!`);
    globals[this.channel.id] = new ValueSaver();
    globals[this.channel.id].set(`channel`, this.channel.id);
    globals[this.channel.id].set(`embed`, new Discord.MessageEmbed());
    globals[this.channel.id].set(`time`, `1 day`);
    globals[this.channel.id].set(`settings`, {bots: false, winners: 1});
    globals[this.channel.id].set(`interval`, 5000);
    globals[this.channel.id].set(`reaction`, `🎉`);
    globals[this.channel.id].set(`endcolor`, `#428af5`);
    globals[this.channel.id].set(`ended`, 0);

    this.emit(`create`);
  }
  setPrize(prize){
    if(!prize || typeof prize !== 'string') throw new Error(`prize is required and must be a string`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setTitle(prize));
    globals[this.channel.id].set(`prize`, prize);
    return this;
  }
  setBeginColor(color){
    if(!color || typeof color !== 'string') throw new Error(`color is required and must be a string`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setColor(color));
    return this;
  }
  setEndColor(color){
    if(!color || typeof color !== 'string') throw new Error(`color is required and must be a string`);
    globals[this.channel.id].set(`endcolor`, color);
    return this;
  }
  setReaction(reaction){
    if(!reaction || typeof reaction !== 'string') throw new Error(`reaction is required and must be a string`);
    globals[this.channel.id].set(`reaction`, reaction);
    return this;
  }
  setHostedBy(userid){
    if(!userid || typeof userid !== 'string' && typeof userid !== 'number') throw new Error(`User id for function 'setHostedBy' is not a valid user id`);
    globals[this.channel.id].set(`hostedby`, `<@!${userid}>`);
    return this;
  }
  setInterval(time){
    if(typeof time !== 'string' && typeof time !== 'number') throw new Error(`time is required and must be a string a string or a number.`);
    globals[this.channel.id].set(`interval`, time);
    return this;
  }
  setDescription(description){
    if(!description || typeof description !== 'string') throw new Error(`description is required and must be a string`);
    globals[this.channel.id].set(`description`, description);
    return this;
  }
  setEndDescription(description){
    if(!description || typeof description !== 'string') throw new Error(`description is required and must be a string`);
    globals[this.channel.id].set(`enddescription`, description);
    return this;
  }
  setTop(name, imgurl){
    if(!name || typeof name !==  'string' || !imgurl || typeof imgurl !== 'string') throw new Error(`name and imgurl are required and must both be a string`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setAuthor(name, imgurl));
    return this;
  }
  setTag(tag){
    if(!tag) throw new Error(`tag is required`);
    if(this.channel.guild.roles.cache.get(String(tag))) globals[this.channel.id].set(`tag`, `<@&${tag}>`);
    else if(this.channel.guild.members.cache.get(String(tag))) globals[this.channel.id].set(`tag`, `<@!${tag}>`);
    else globals[this.channel.id].set(`tag`, tag);
    return this;
  }
  setTime(time){
    if(typeof time !== `string` && typeof time !== 'number') throw new Error(`time is required and must be a string or a number`);
    globals[this.channel.id].set(`time`, time);
    return this;
  }
  setFooter(footer){
    if(!footer || typeof footer !== 'string') throw new Error(`footer is required and must be a string`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setFooter(footer));
    return this;
  }
  addSettings(settings = {winners: 1, bots: false}){
    if(!settings || typeof settings !== 'object') throw new Error(`settings is required and must be an object`);
    for(var key in settings){
        globals[this.channel.id].get(`settings`)[key] = settings[key];
    }
    return this;
  }
  setThumbnail(img_url){
    if(typeof img_url !== 'string') throw new Error(`Please include an image url in order to set the thumbnail`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setThumbnail(img_url));
    return this;
  }
  setImage(img_url){
    if(typeof img_url !== 'string') throw new Error(`Please include an image url in order to set the image`);
    globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setImage(img_url));
    return this;
  }
  addTimestamp(){
    globals[this.channel.id].set(`add_timestamp`, 1);
    return this;
  }
  remove(){
    delete globals[this.channel.id];
  }
  send(){
    return new Promise(async (resolve, reject) => {
      var content = ``;
      if(globals[this.channel.id].get(`tag`)) content = globals[this.channel.id].get(`tag`);
      if(globals[this.channel.id].get(`description`)){
        if(content.length > 0){
          content += `\n${globals[this.channel.id].get(`description`)}`;
        } else content = globals[this.channel.id].get(`description`);
      }
      var sendmessage;
      const endstamp = ms(typeof globals[this.channel.id].get(`time`) === 'string' ? globals[this.channel.id].get(`time`) : ms(globals[this.channel.id].get(`time`)));
      if(endstamp === undefined) throw new Error(`Invalid time passed!`);
      const enddate = new Date(new Date().getTime() + endstamp).getTime();
      const now = new Date().getTime();
      const diffTime = enddate - now;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffSeconds = Math.floor(diffTime / 1000);
      var endsin = ``;
      const hours = diffHours - (diffDays * 24);
      const seconds = diffSeconds - (diffHours * 60 * 60);
      const minutes = diffMinutes - (diffHours * 60);
      if(diffDays > 0) endsin = `Ends in ${diffDays} ${diffDays > 1 ? 'days' : 'day'} and ${hours} ${hours > 1 || hours === 0 ? 'hours' : 'hour'}`;
      else {
        endsin = `Ends today in ${diffHours} ${diffHours > 1 || diffHours === 0 ? 'hours' : 'hour'} ${minutes} ${minutes > 1 || minutes === 0 ? 'minutes' : 'minute'} and ${seconds} ${seconds > 1 || seconds === 0 ? 'seconds' : 'second'}`;
      }
      const hostedby = globals[this.channel.id].get(`hostedby`);
      globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setDescription(`React with ${globals[this.channel.id].get(`reaction`) || `🎉`} to participate!${hostedby ? `\nHosted by: ${hostedby}` : ``}\n${globals[this.channel.id].get(`settings`)['winners']} winner(s)\n\n${endsin}`));
      if(Boolean(globals[this.channel.id].get(`add_timestamp`)) === true) globals[this.channel.id].set(`embed`, globals[this.channel.id].get(`embed`).setTimestamp(enddate));
      try{
        if(discordversion === 12){
          var message;
          if(content.length > 0) sendmessage = await this.channel.send(content, globals[this.channel.id].get(`embed`));
          else sendmessage = await this.channel.send(globals[this.channel.id].get(`embed`));
        }
        else if(discordversion > 12){
          var message = {embeds: [globals[this.channel.id].get(`embed`)]};
          if(content.length > 0) message['content'] = content;
          sendmessage = await this.channel.send(message);
        }
        else return reject(new Error(`Discord.js versions below 12 are not supported`));
        sendmessage.react(globals[this.channel.id].get(`reaction`) || `🎉`);
        messages[sendmessage.id] = globals[this.channel.id].get(`embed`);
        globals[sendmessage.id] = globals[this.channel.id];
        globals[sendmessage.id].set(`endtimestamp`, enddate);
        delete globals[this.channel.id];
        var json = {
            messageid: sendmessage.id,
            channelid: sendmessage.channel.id,
            enddate: enddate,
            globals: globals[sendmessage.id].toReadableArray()
        };
        giveaways.push(json);
        getgiveaways.set(sendmessage.id, 1);
        fs.writeFileSync(storage, JSON.stringify(giveaways));
        onEnd.emit(`start`, sendmessage.id, this.channel.id);
        updateMessage(enddate, sendmessage);
        resolve(sendmessage.id);
      } catch (error){
        return reject(new Error(`Couldn't send giveaway for the following reason: ${error}`));
      }
    });
  }
};

module.exports.Giveaway = Giveaway;
module.exports.ClientManager = ClientManager;