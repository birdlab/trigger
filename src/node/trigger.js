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
timezone = 10800000;

var fastdata = {}

exports.timezone = timezone;
exports.channels = channels;
exports.users = users;
exports.fastdata = fastdata;

exports.user = function (id) {
	for (var u in users) {
		if (users[u].id == id) {
			return users[u];
		}
	}
	return false;
}

exports.getuser = function (id, callback) {
	var finded = false;
	for (var u in users) {
		if (users[u].id == id) {
			finded = true;
			if (callback) {
				callback(users[u]);
			} else {
				return (users[u]);
			}
		}
	}
	if (!finded) {
		if (callback) {
			db.getuser(id, function (dbdata) {
				callback(dbdata.user);
			});
		} else {
			return false;
		}
	}
}

exports.channel = function (id) {
	for (var ch in channels) {
		if (channels[ch].id == id) {
			return channels[ch];
		}
	}
	return false;
}
function start() {

		db.getChannels(function (data) {
	 if (data && !data.error) {
	 exec('killall mpd', function (error, stdout, stderr) {
	 for (var i in data) {
	 if (data[i].active > 0) {
	 var channel = ch.newChannel(data[i]);
	 channels.push(channel);
	 }
	 }
	 findfiles();
	 });
	 } else {
	 console.log(data.error);
	 }
	 });

	//restoreGold()
}


start();

restorequery = [];

function getDBTrack() {
	var path = restorequery.shift();
	db.getTrackByPath(path, function (tr) {
		for (var t in tr) {
			track = tr[t];
			track.path = path;
			for (var c in channels) {
				if (channels[c].id == track.channel) {
					channels[c].addTrack(track);
					break;
				}
			}
			break;
		}
		getDBTrack();
	});
}

function findfiles() {
	exec('find /home/trigger/upload -iname "*.*"', function (error, stdout, stderr) {
		restorequery = stdout.split('\n');
		for (var t in restorequery) {
			restorequery[t] = restorequery[t].split('/');
			restorequery[t] = restorequery[t][restorequery[t].length - 1];
		}
		getDBTrack();

		db.getTracks(files, function (tracks) {
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


function restoreGold() {
	var vaultPath = "/home/trigger/birdlab_vault/OCZ/trigger/gold";


	var getDBTrack = function () {
		if (restorequery.length) {
			var path = restorequery.shift();
			console.log('serach path -');
			console.log(path);
			db.getTrackByPath(path, function (tr) {
				console.log(tr[0]);
				for (var t in tr) {
					track = tr[t];
					console.log(track.artist);
					console.log(track.title);
					console.log(track.path);
					console.log('--------------- on disk');

					db.setOnDisk(track.id);
					break;
				}
				getDBTrack();
			});
		}
	}

	exec('find ' + vaultPath + ' -iname "*.*"', function (error, stdout, stderr) {
		console.log('tracks finded');
		restorequery = stdout.split('\n');
		console.log(restorequery.length);
		for (var t in restorequery) {
			restorequery[t] = restorequery[t].split('/');
			restorequery[t] = restorequery[t][restorequery[t].length - 1];

		}
		getDBTrack();


	});
}
