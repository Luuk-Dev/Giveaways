import { TextChannel, Client } from "discord.js";

type Time = string | number;

interface GiveawayEvents{
    create: [];
}

interface ClientManagerEvents{
    pass: [];
    update: [];
    end: [string];
    start: [string, string];
    reroll: [string];
}

export declare class ClientManager{
    /**
     * Creates a ClientManager 
     * @param client The Discord.js client
     */
    constructor(client: Client);
    
    /**
     * Set a custom storage instead of the default storage inside the package.
     * @param storage The location of the storage for all the giveaways.
     */
    setCustomStorage(storage: string);

    /**
     * Reroll a giveaway
     * @param messageid The message id of the giveaway
     */
    reroll(messageid: string) : Promise<string>;

    /**
     * Force end a giveaway
     * @param messageid The message id of the giveaway
     */
    end(messageid: string) : Promise<string>;

    /**
     * Force remove a giveaway
     * @param messageid The message id of the giveaway
     */
    remove(messageid: string) : Promise<string>;

    on<T extends keyof ClientManagerEvents>(eventName: T, listener: (...args: ClientManagerEvents[T]) => void);
    once<T extends keyof ClientManagerEvents>(eventName: T, listener: (...args: ClientManagerEvents[T]) => void);
    emit<T extends keyof ClientManagerEvents>(eventName: T, listener: (...args: ClientManagerEvents[T]) => void);
}

export declare class Giveaway{
    /**
     * Creates a giveaway which can be send in a text channel.
     * @param channel The channel to send the giveaway in.
     * @example
     * const giveaway = new Giveaway(<channel>);
     */
    constructor(channel: TextChannel);

    /**
     * Set a price for your giveaway
     * @param prize The prize to give away
     * @example
     * giveaway.setPrize(`Some cool prize`);
     */
    setPrize(prize: string) : Giveaway;

    /**
     * Set the embed color
     * @param color The color of the embed when the giveaway is going on
     */
    setBeginColor(color: string) : Giveaway;

    /**
     * Set the color of the embed for if the giveaway ended
     * @param color The color of the embed when the giveaway ended
     */
    setEndColor(color: string) : Giveaway;

    /**
     * Set the reaction of the user to participate.
     * @param reaction The emote that people have to use to join the giveaway
     */
    setReaction(reaction: string) : Giveaway;

    /**
     * Set who hosts the giveaway
     * @param userid The user id of the user that is hosting the giveaway
     */
    setHostedBy(userid: string) : Giveaway;

    /**
     * Set the interval of updating the embed with the updated time
     * @param time The time in ms that the bot have to update the embed
     */
    setInterval(time: Time) : Giveaway;

    /**
     * Set the description of the giveaway
     * @param description The description of the giveaway
     */
    setDescription(description: string) : Giveaway;

    /**
     * The description of the embed when the giveaway got ended
     * @param description The description of the embed when the giveaway got ended
     */
    setEndDescription(description : string) : Giveaway;

    /**
     * Customize the top of the embed
     * @param name The name at the top of the embed
     * @param imgurl The image at the top of the embed
     */
    setTop(name: string, imgurl: string) : Giveaway;

    /**
     * Set which role/tag the bot needs to tag
     * @param tag The role/tag/user to tag when the giveaway starts
     */
    setTag(tag: string) : Giveaway;

    /**
     * Set the footer of the giveaway
     * @param footer The footer of the giveaway
     */
    setFooter(footer: string) : Giveaway;

    /**
     * Set custom settings
     * @param settings The custom settings that you want to set. Set the amount of winners or if bots are allowed to win or not.
     */
    addSettings(settings: {"winners": number, "bots": boolean}) : Giveaway;

    /**
     * Set how long the giveaway will take
     * @param time The time of the giveaway.
     */
    setTime(time: string | number) : Giveaway;

    /**
     * Cancel the giveaway
     */
    remove();

    /**
     * Add a timestamp to the giveaway embed
     */
    addTimestamp() : Giveaway;

    /**
     * Add a thumbnail to your giveaway embed
     * @param img_url The url or path of the image to add as thumbnail
     */
    setThumbnail(img_url: string) : Giveaway;

    /**
     * Add an image to your giveaway embed
     * @param img_url The url or path of the image to add as image to the giveaway embed
     */
    setImage(img_url: string) : Giveaway;

    /**
     * Send the giveaway
     */
    send() : Promise<string>;

    on<T extends keyof GiveawayEvents>(eventName: T, listener: (...args: GiveawayEvents[T]) => void);
    once<T extends keyof GiveawayEvents>(eventName: T, listener: (...args: GiveawayEvents[T]) => void);
    emit<T extends keyof GiveawayEvents>(eventName: T, listener: (...args: GiveawayEvents[T]) => void);

    private channel: TextChannel;
}