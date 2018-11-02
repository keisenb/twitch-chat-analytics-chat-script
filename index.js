require('dotenv').load();
const tmi = require('tmi.js')
const log = require('node-file-logger');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

log.SetUserOptions({
    timeZone: 'America/Chicago',
    folderPath: './logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'kevin_',
    fileNameExtension: '.log',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss.SSS',
    logLevel: 'debug',
    onlyFileLogging: true
});

const dbName = process.env.ENV;
const mongoClient = new MongoClient(process.env.MONGO, { useNewUrlParser: true });

(async function () {
    await mongoClient.connect();
    console.log("Connected correctly to mongo server");
    client.connect();
    console.log("connecting to twitchchat");
  })();

var channels = [process.env.CHANNEL_NAME];
showConnectionNotices = null; // Show messages like "Connected" and "Disconnected"

clientOptions = {
    options: {
        debug: true
    },
    channels: channels
};
client = new tmi.client(clientOptions);

async function handleChat(channel, user, message, self) {
    var userId = parseInt(user['user-id']);
    try {
        const db = mongoClient.db(dbName);

        var val = { userid: userId, username: user.username, message: message, posted: new Date() };
        let r = await db.collection('messages').insertOne(val);
        assert.equal(1, r.insertedCount);

      } catch (err) {
        console.log(err.stack);
      }
}

function chatNotice(information) {
    console.log(information);
}

function dehash(channel) {
    return channel.replace(/^#/, '');
}

function capitalize(n) {
    return n[0].toUpperCase() + n.substr(1);
}

client.addListener('message', handleChat);

client.addListener('connecting', function (address, port) {
    if (showConnectionNotices) chatNotice('Connecting');
});
client.addListener('logon', function () {
    if (showConnectionNotices) chatNotice('Authenticating');
});
client.addListener('connectfail', function () {
    if (showConnectionNotices) chatNotice('Connection failed');
});
client.addListener('connected', function (address, port) {
    if (showConnectionNotices) chatNotice('Connected');
});
client.addListener('disconnected', function (reason) {
    if (showConnectionNotices) chatNotice('Disconnected: ' + (reason || ''));
});
client.addListener('reconnect', function () {
    if (showConnectionNotices) chatNotice('Reconnected');
});
client.addListener('join', function (channel, username) {
    if (username == client.getUsername()) {
        if (showConnectionNotices) chatNotice('Joined ' + capitalize(dehash(channel)));
    }
});

client.addListener('crash', function () {
    chatNotice('Crashed');
    log.Error('Twitch chat crashed');
});

