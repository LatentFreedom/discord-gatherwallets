const {Constants, Client, Intents, MessageEmbed} = require('discord.js');
const { MongoClient } = require("mongodb");
require('dotenv').config();

const client = new Client({
    intents : [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

client.on('ready', () => {
    console.log('Wallet Gather Running...');
    createCommands();
});

const createCommands = () => {
    const Guilds = client.guilds.cache.map(guild => guild.id);
    // Add commands to all guilds
    Guilds.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId);
        let commands = guild.commands;
        // check wallet
        commands?.create({
            name: "checkwallet",
            description: "check to see the ETH address you added to the presale list"
        });
        // set wallet
        commands?.create({
            name: "setwallet",
            description: "Set ETH wallet to the presale list",
            options: [
                {
                    name: "wallet",
                    description: "ETH wallet address",
                    required: true,
                    type: Constants.ApplicationCommandOptionTypes.STRING
                }
            ]
        })
        // update wallet
        commands?.create({
            name: "updatewallet",
            description: "Update ETH wallet on presale list",
            options: [
                {
                    name: "wallet",
                    description: "ETH wallet address",
                    required: true,
                    type: Constants.ApplicationCommandOptionTypes.STRING
                }
            ]
        })
    });
}

const checkWallet = async (name) => {
    const clientDb = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    let message = '';
    try {
        const doc = await db.collection('wallets').findOne({name:name});
        if (!doc) {
            message = `You have not added a wallet **${name}**. Make sure to do so before wallet collection is closed.`;
        } else {
            const wallet = doc.wallet;
            message = `Thanks, **${name}**. Your current wallet saved is **${wallet}**.`;
        }
    } catch (err) {
        console.log(err);
        message = `Sorry, **${name}**. There was an error checking for your wallet.`;
    }
    clientDb.close();
    return message;
}

const setWallet = async (wallet, user) => {
    const name = user.username;
    const clientDb = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    const walletSaved = await db.collection('wallets').findOne({name:name});
    let message = '';
    console.log(user);
    console.log(walletSaved);
    if (!walletSaved) {
        await db.collection('wallets').insertOne(
            {
                name : name,
                user : user,
                wallet : wallet
            }
        );
        message = `Thanks, **${name}**. Your wallet **${wallet}** has been **saved**.`;
    } else {
        message = `Thanks, **${name}** but your wallet is already set to **${walletSaved.wallet}**. Please use **/updatewallet** to update your wallet.`;
    }
    clientDb.close();
    return message;
}

const updateWallet = async (wallet, user) => {
    const name = user.username;
    const clientDb = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    const walletSaved = await db.collection('wallets').findOne({name:name});
    let message = '';
    console.log(user);
    console.log(walletSaved);
    if (!walletSaved) {
        message = `You have not added a wallet **${name}**. Make sure to do so before wallet collection is closed.`;
    } else {
        await db.collection('wallets').updateOne({name:name}, {
            '$set' : {
                wallet : wallet
            }
        });
        message = `Thanks, **${name}**. Your wallet has been **updated** to **${wallet}**.`;
    }
    clientDb.close();
    return message;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) { return; }
    const { commandName, options } = interaction;
    if (commandName === 'checkwallet') {
        // Process check wallet
        await interaction.deferReply({
            ephemeral: true
        });
        const user = interaction.user;
        const name = user.username;
        const message = await checkWallet(name);
        await interaction.editReply({
            content: message,
        });
    } else if (commandName === 'setwallet') {
        // Process set wallet
        await interaction.deferReply({
            ephemeral: true,
        });
        const wallet = options.getString('wallet');
        const user = interaction.user;
        const message = await setWallet(wallet, user);
        await interaction.editReply({
            content: message,
        });
    } else if (commandName === 'updatewallet') {
        // Process update wallet
        await interaction.deferReply({
            ephemeral: true,
        });
        const wallet = options.getString('wallet');
        const user = interaction.user;
        const message = await updateWallet(wallet, user);
        await interaction.editReply({
            content: message,
        });
    }
})

client.login(process.env.DISCORD_TOKEN);