/**
 * Created by Bird on 14.09.16.
 */
var exec = require("child_process").exec;
var db = require('./trigger/db.local.js');

var users = [];

function getActivity(id) {
	var q = 'SELECT  * FROM tracks WHERE  tracks.submiter = ' + id;
	db.connection.query(q, function (e, result, fields) {

		if (result.length) {
			for (var u in result) {
				console.log(result[u]);
			}
		}
	});
}

function deleteActivity(id) {
	var q = 'DELETE FROM tracks WHERE  tracks.submiter = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result.affectedRows);
	});
	var q = 'DELETE FROM prvote WHERE  prvote.voterid = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result.affectedRows);
	});
	var q = 'DELETE FROM prvote WHERE  prvote.userid = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result);
	});
	var q = 'DELETE FROM uservote WHERE  uservote.voterid = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result.affectedRows);
	});

	var q = 'DELETE FROM trackvote WHERE  trackvote.voterid = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result.affectedRows);
	});
	var q = 'DELETE FROM uservote WHERE  uservote.userid = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result.affectedRows);
	});
	var q = 'UPDATE users SET password="_" where users.id = ' + id;
	db.connection.query(q, function (e, result, fields) {
		console.log(result);
	});
}

var q = 'SELECT * FROM users WHERE id = 57';
db.connection.query(q, function (e, result, fields) {
	if (!e && result.length) {
		users = result;
		for (var u in users) {
			console.log('----->>');
			console.log(users[u]);
			//getActivity(users[u]['id']);
			deleteActivity(users[u]['id']);
		}
	}
});

var q = 'DELETE FROM chat WHERE  chat.userid = 57';
db.connection.query(q, function (e, result, fields) {
	console.log(result);
});