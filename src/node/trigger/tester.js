var exec = require("child_process").exec;

var port = 6600;
var testchanel = null;
var query = [];
var process = false;

function testplay(q) {
    process = true;
    var shortpath = q.path.split('/');
    shortpath = shortpath[shortpath.length - 1];
    exec('mpc -p ' + port + ' update --wait', function(error, stdout, stderr) {
        if (!error) {
            exec('mpc -p ' + port + ' clear --wait', function(error, stdout, stderr) {
                if (!error) {
                    exec('mpc -p ' + port + ' add "' + shortpath + '"', function(error, stdout, stderr) {
                        if (!error) {
                            exec('mpc -p ' + port + ' -f %time%  play', function(error, stdout, stderr) {
                                if (!error) {
                                    var ans = stdout.split('\n');
                                    if (ans[1].substring(0, 9) != '[playing]') {
                                        q.callback(false);
                                    } else {
                                        var ts = ans[0].split(':');
                                        var time = parseInt(ts[0]) * 60 + parseInt(ts[1]);
                                        exec('mpc -p ' + port + ' stop', function(error, stdout, stderr) {
                                            if (!error) {
                                                process = false;
                                                if (query.length > 0) {
                                                    testplay(query.shift());
                                                }
                                                q.callback(time);
                                            } else {
                                                console.log('tester - > ',error);
                                                process = false;
                                                if (query.length > 0) {
                                                    testplay(query.shift());
                                                }
                                            }
                                        });
                                    }
                                } else {
                                    process = false;
                                    console.log('tester - > ',error);
                                    q.callback(false);
                                    if (query.length > 0) {
                                        testplay(query.shift());
                                    }
                                }
                            });
                        } else {
                            console.log('tester - > ',error);
                            process = false;
                            q.callback(false);
                            if (query.length > 0) {
                                testplay(query.shift());
                            }
                        }
                    });
                } else {
                    console.log('tester - > ',error);
                    process = false;
                    q.callback(false);
                    if (query.length > 0) {
                        testplay(query.shift());
                    }
                }
            });
        } else {
            console.log('tester - > ',error);
            if (check()) {
                testplay(q);
            } else {
                setTimeout(function() {
                    testplay(q);
                }, 1000);
            }
        }
    });
}


function check() {
    if (testchanel == null) {
        exec('mpd --no-daemon /home/trigger/mpd/tester/mpd.conf', function(error, stdout, stderr) {
            testchanel = null;
        });
        testchanel = true;
        return(false);
    } else {
        return(true)
    }
}
exports.test = function(path, callback) {
    if (path) {
        console.log('tester get name - ', path);
        var t = {
            'path': path,
            'callback': callback
        }
        query.push(t);
        if (!process) {
            var q = query.shift();
            if (check()) {
                testplay(q);
            } else {
                setTimeout(function() {
                    testplay(q);
                }, 1000);
            }
        }
    }
};