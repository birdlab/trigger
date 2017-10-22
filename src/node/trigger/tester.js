var exec = require("child_process").exec;

var port = 6600;
var testchanel = null;
var query = [];
var process = false;

var errors = 0;

function processerror(q, error) {
	console.log(error);
	process = false;
	errors++;
	if (errors > 30) {
		process.exit();
	}
	if (q.callback) {
		q.callback({'error': error})
	}
	if (query.length > 0) {
		testplay(query.shift());
	}
}

function testplay(q) {
	process = true;
	var shortpath = q.path.split('/');
	shortpath = shortpath[shortpath.length - 1];
	var tquery = 'chmod 777 "/home/trigger/upload/'+ shortpath + '"';

	exec(tquery, function (error, stdout, stderr) {

		var tquery = 'mpc -p ' + port + ' update --wait';
		exec(tquery, function (error, stdout, stderr) {

			if (!error) {
				var tquery = 'mpc -p ' + port + ' clear --wait';
				exec(tquery, function (error, stdout, stderr) {
					if (!error) {
						var tquery = 'mpc -p ' + port + ' add "' + shortpath + '"';
						exec(tquery, function (error, stdout, stderr) {
							if (!error) {
								exec('mpc -p ' + port + ' -f %time%  play', function (error, stdout, stderr) {
									if (!error) {
										var ans = stdout.split('\n');
										if (ans[1].substring(0, 9) != '[playing]') {
											process = false;
											errors++;
											if (query.length > 0) {
												testplay(query.shift());
											}
											q.callback({'error': 'tester still play'});
										} else {
											var ts = ans[0].split(':');
											var time = parseInt(ts[0]) * 60 + parseInt(ts[1]);
											exec('mpc -p ' + port + ' stop', function (error, stdout, stderr) {
												if (!error) {
													process = false;
													if (query.length > 0) {
														testplay(query.shift());
													}
													errors = 0;
													q.callback(time);
												} else {
													processerror(q, error)
												}
											});
										}
									} else {
										processerror(q, error);
									}
								});
							} else {
								processerror(q, error);
							}
						});
					} else {
						processerror(q, error);
					}
				});
			} else {
				processerror(q, error);
			}
		});
	});


}


function check() {
	if (testchanel == null) {
		exec('mpd --no-daemon /home/trigger/mpd/tester/mpd.conf', function (error, stdout, stderr) {
			testchanel = null;
		});
		testchanel = true;
		return (false);
	}
	else {
		return (true)
	}
}
function startplay() {
	if (!process) {
		var q = query.shift();
		if (typeof q != 'undefined') {
			if (check()) {
				testplay(q);
			} else {
				setTimeout(function () {
					startplay();
				}, 1000);
			}
		}
	}
}
exports.test = function (path, callback) {
	if (path) {
		console.log('tester get name - ', path);
		var t = {
			'path': path,
			'callback': callback
		}
		query.push(t);
		startplay();
	}
};