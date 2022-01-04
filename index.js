const {Constants, Client, Intents } = require('discord.js');
const { MongoClient } = require("mongodb");
require('dotenv').config();

const client = new Client({
    intents : [Intents.FLAGS.GUILDS]
});

client.on('ready', () => {
    console.log('Gather Wallets Running...');
    createCommandsForGuilds();
});

const createCommands = (guildId) => {
    const guild = client.guilds.cache.get(guildId);
    let commands = guild.commands;
    // check wallet
    commands?.create({
        name: "checkwallet",
        description: "Check to see the ETH address added to the list"
    });
    // set wallet
    commands?.create({
        name: "setwallet",
        description: "Add ETH wallet to the list",
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
        description: "Update ETH wallet on the list",
        options: [
            {
                name: "wallet",
                description: "ETH wallet address",
                required: true,
                type: Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    });
}

const createCommandsForGuilds = () => {
    // Check if guild id set
    if (process.env.GUILD_ID) {
        createCommands(process.env.GUILD_ID);
    } else {
        const Guilds = client.guilds.cache.map(guild => guild.id);
        // Add commands to all guilds
        Guilds.forEach(guildId => {
            createCommands(guildId);
        });
    }
}

const checkWallet = async (name) => {
    const clientDb = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    let message = '';
    const doc = await db.collection('wallets').findOne({name:name});
    if (!doc) {
        message = `You have not added a wallet **${name}**. Make sure to do so before wallet collection is closed.`;
    } else {
        const wallet = doc.wallet;
        message = `Thanks, **${name}**. Your current wallet saved is **${wallet}**.`;
    }
    clientDb.close();
    return message;
}

const setWallet = async (wallet, user) => {
    const name = user.username;
    const clientDb = MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    const walletSaved = await db.collection('wallets').findOne({name:name});
    let message = '';
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

const updateWallet = async (wallet, name) => {
    const clientDb = await MongoClient.connect(process.env.MONGO_URI, { useNewUrlParser: true });
    const db = clientDb.db('gatherwallets');
    const walletSaved = await db.collection('wallets').findOne({name:name});
    let message = '';
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
    try {
        if (!interaction.isCommand()) { return; }
        // Check if command was sent in desired channel
        if (process.env.CHANNEL_ID && interaction.channel.id !== process.env.CHANNEL_ID) {
            await interaction.reply({
                ephemeral: true,
                content: 'This command cannot be used in this channel.'
            });
            return;
        }
        // Check if user has desired role name
        if (process.env.ROLE_ID && !interaction.member.roles.cache.has(process.env.ROLE_ID)) {
            const role = interaction.guild.roles.cache.get(process.env.ROLE_ID);
            await interaction.reply({
                ephemeral: true,
                content: `This command cannot be used without the **${role}** role.`
            });
            return;
        }
        const { commandName, options } = interaction;
        const user = interaction.user;
        let message = '';
        await interaction.deferReply({
            ephemeral: true
        });
        if (commandName === 'checkwallet') {
            message = await checkWallet(user.username);
        } else if (commandName === 'setwallet') {
            const wallet = options.getString('wallet');
            message = await setWallet(wallet, user);
        } else if (commandName === 'updatewallet') {
            const wallet = options.getString('wallet');
            message = await updateWallet(wallet, user.username);
        }
        await interaction.editReply({
            content: message,
        });
    } catch (err) {
        console.log(err);
    }
})

client.login(process.env.DISCORD_TOKEN);