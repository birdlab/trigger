var db=require('./db.local.js');
var sanitize = require('validator').sanitize;

function findmessage(message){
	db.connection.query('SELECT *,  FROM botmind WHERE message LIKE '+query, function(e, result, fields){
		if (!e){
		
		} else {
			console.log(e);
		}
	});
}
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('end', function () {
  process.stdout.write('ОПА! end');
});