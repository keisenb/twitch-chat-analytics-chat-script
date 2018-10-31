const tmi = require('tmi.js')
require('dotenv').load();


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
    //todo do something with this
    console.log(message);
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
client.addListener('part', function (channel, username) {
    var index = joinAccounced.indexOf(channel);
    if (index > -1) {
        if (showConnectionNotices) chatNotice('Parted ' + capitalize(dehash(channel)));
        joinAccounced.splice(joinAccounced.indexOf(channel), 1)
    }
});

client.addListener('crash', function () {
    chatNotice('Crashed');
});

client.connect();