# Discord Gather Wallets Bot
Get a bot to gather wallets for a presale in discord.

## Sites Used
1. Discord Dev URL **[https://discord.com/developers/applications](https://discord.com/developers/applications)**
2. Discord Bot Docs **[https://discord.com/developers/docs/intro](https://discord.com/developers/docs/intro)**
3. MongoDb Docs **[https://docs.mongodb.com/manual/introduction/](https://docs.mongodb.com/manual/introduction/)**

## Running the bot
1. Get the needed packages with `npm install`
2. Create `.env` and fill it with the needed values
3. Set up `mongodb` with `gatherwallets` database and use `walelts` collection
4. run with `node index.js`

## Values in `.env`
```
DISCORD_TOKEN=
MONGO_URI=mongodb://localhost:27017
# channel id for the channel that will reply to the commands
CHANNEL_ID=
```

## Discord / Commands
1. **checkwallet:** check to see the ETH address you added to the presale list
2. **setwallet:** Set ETH wallet to the presale list
3. **updatewallet:** Update ETH wallet on presale list