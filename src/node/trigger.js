var exec = require("child_process").exec;
var sockets = require('./trigger/sockets.js');
var db = require('./trigger/dbdata.js');
var utils = require('./trigger/utils.js');
var ch = require('./trigger/channel.js');
var tester = require('./trigger/tester.js');
var parser = require('./trigger/dataparser.js');


var channels = [],
    tracks = [],
    files = [],
    users = [];

var fastdata = {}



exports.channels = channels;
exports.users = users;
exports.fastdata = fastdata;

exports.user = function(id) {
    for (var u in users) {
        if (users[u].id == id) {
            return users[u];
        }
    }
    return false;
}

exports.getuser = function(id, callback) {
    for (var u in users) {
        if (users[u].id == id) {
            callback(users[u]);
        }
    }
    db.getuser(id, function(dbdata) {
        callback(dbdata.user);
    });
}

exports.channel = function(id) {
    for (var ch in channels) {
        if (channels[ch].id == id) {
            return channels[ch];
        }
    }
    return false;
}
function start() {
    var fd = fastdata;
    //   parser.parseDB(function(d){
    //       fd=d;
    db.getChannels(function(data) {
        if (data) {
            exec('killall mpd', function(error, stdout, stderr) {
                //for (var i in data) {
                    var channel = ch.newChannel(data[0]);
                    channels.push(channel);
                //}
                findfiles();
            });
        }
    });
    ///  });

}


start();

function findfiles() {
    exec('find /home/trigger/upload -iname "*.*"', function(error, stdout, stderr) {
        files = stdout.split('\n');
        for (var t in files) {
            files[t] = files[t].split('/');
            files[t] = files[t][files[t].length - 1];
        }
        db.getTracks(files, function(tracks) {
            for (var t in tracks) {
                for (var c in channels) {
                    if (channels[c].id == tracks[t].channel) {
                        channels[c].addTrack(tracks[t]);
                        break;
                    }
                }
            }
        });
    });
}


