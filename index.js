require('dotenv').load();
const tmi = require('tmi.js')
const uuid = require('uuid/v1');
const cassandra = require('cassandra-driver');
const fs = require('fs');
const log = require('node-file-logger');

const ssl_option = {
    cert: fs.readFileSync("./server.crt"),
    secureProtocol: 'TLSv1_2_method'
};

const options = {
    timeZone: 'America/Chicago',
    folderPath: './logs/',
    dateBasedFileNaming: true,
    fileNamePrefix: 'kevin_',
    fileNameExtension: '.log',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss.SSS',
    logLevel: 'debug',
    onlyFileLogging: true
}

log.SetUserOptions(options);

// Note: If you set dateBasedFileNaming to false, then a log file will be created at the folder path with the provided fileName.
// If set to true then a logfile will be created with the name <fileName> provided in the options

log.SetUserOptions(options);

const authProviderLocalCassandra = new cassandra.auth.PlainTextAuthProvider(process.env.CASSANDRA_USERNAME, process.env.CASSANDRA_PASSWORD);
const cassandraClient = new cassandra.Client({ contactPoints: [process.env.CASSANDRA_CONTACT_POINT], authProvider: authProviderLocalCassandra, sslOptions: ssl_option });

var channels = [process.env.CHANNEL_NAME];
showConnectionNotices = null; // Show messages like "Connected" and "Disconnected"

clientOptions = {
    options: {
        debug: true
    },
    channels: channels
};
client = new tmi.client(clientOptions);


function dehash(channel) {
    return channel.replace(/^#/, '');
}

function capitalize(n) {
    return n[0].toUpperCase() + n.substr(1);
}

function handleChat(channel, user, message, self) {
    var userId = parseInt(user['user-id']);
    const query = 'INSERT INTO prod.messages (id, message, userid, username, posted) VALUES (?, ?, ?, ?, ?)';
    const params = [
        uuid(),
        message,
        userId,
        user.username,
        new Date()
    ]
    cassandraClient.execute(query, params, { prepare: true })
        .then(() => console.log('Success'))
        .catch(e => {
            console.log('error sending message to cassandra', e);
            log.Error('Error sending message to cassandra', 'service', 'handleChat', e);
        });
}

function chatNotice(information) {
    console.log(information);
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

client.connect();
