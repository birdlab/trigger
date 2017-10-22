/**
 * Created by Bird on 14.09.16.
 */
var exec = require("child_process").exec;
var db = require('./trigger/db.local.js');

var files=[];

function setGold(path) {
	path=path.split('/')[path.split('/').length-1];
	var q='SELECT tracks.id, tracks.channel, tracks.date, tracks.artist, tracks.title, tracks.gold, tracks.ondisk FROM tracks WHERE tracks.path LIKE \'%' + path + '%\' order by date desc'
	//console.log(q);
	db.connection.query(q, function (e, result, fields) {
		if (!e && result.length) {
			track=false
			for (var r in result){
				if (result[r]['ondisk']){
					track=result[r];
					setGold(files.shift());
					break;
				}
			}
			if (!track){
				console.log('process '+path);
				console.log(result[0]);
				var q = "UPDATE tracks SET gold = " + db.connection.escape(1) + ", ondisk = " + db.connection.escape(1) + "  WHERE id =" + db.connection.escape(result[0]['id']);
				console.log(q);
				db.connection.query(q, function (e, r, fields) {
					console.log('updated');
					setGold(files.shift());
				});
			}
		} else {
			setGold(files.shift());
		}
	});
}

exec('find /home/trigger/birdlab_vault/OCZ/trigger/gold -iname "*.*"', function (error, stdout, stderr) {
	files = stdout.split('\n');
	setGold(files.shift());
});
