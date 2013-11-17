try {
var exec = require("child_process").exec;
var sockets = require('./trigger/sockets.js');
var db=require('./trigger/dbdata.js');
var utils=require('./trigger/utils.js');
var ch=require('./trigger/channel.js');
var tester=require('./trigger/tester.js');


var channels=[],
	tracks=[],
	files=[], 
	users=[];

exports.channels=channels;
exports.users=users;

exports.user=function(id){
	for (var u in users){
		if (users[u].id==id){
			return users[u];
		}
	}
	return false;
}
exports.channel=function(id){
	for (var ch in channels){
		if (channels[ch].id==id){
			return channels[ch];
		}
	}
	return false;
}

function start(){
	db.getChannels(function (data){
	if (data){
		exec('killall mpd', function(error, stdout, stderr){
			for (var i in data){
				if (data[i].id<4){
					var channel=ch.newChannel(data[i]);
					channels.push(channel);
				}
			}
			findfiles();
		});
	}
});
}
start();

function findfiles(){
	exec('find /home/trigger/upload -iname "*.*"', function(error, stdout, stderr){
		files=stdout.split('\n');
		for (var t in files){
				files[t]=files[t].split('/');
				files[t]=files[t][files[t].length-1];
				console.log(files[t]);
				
		}
		db.getTracks(files,function (tracks){
			for (var t in tracks){
				for (var c in channels){
					if (channels[c].id==tracks[t].channel){
						channels[c].addTrack(tracks[t]);
						break;
					}
				}
			}
		});
	});
}


}
catch(err)
  {
	  console.log(err);
  }

