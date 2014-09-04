var db = require('./db.local.js');
var user = require('./user.js');
var exec = require("child_process").exec;
var md5 = require('MD5');
var sanitizer = require('sanitizer');
//var mysql = require('mysql');

var voteq = [];
var uvoteq = [];

var vprocess = false;
var uvprocess = false;


function nmTokenPolicy(nmTokens) {
    if ("specialtoken" === nmTokens) {
        return nmTokens;
    }
    if (/[^a-z\t\n\r ]/i.test(nmTokens)) {
        return null;
    } else {
        return nmTokens.replace(
            /([^\t\n\r ]+)([\t\n\r ]+|$)/g,
            function(_, id, spaces) {
                return 'p-' + id + (spaces ? ' ' : '');
            });
    }
}


function uriPolicy(value, effects, ltype, hints) {
    return value;
}

function strip_tags(str) {	// Strip HTML and PHP tags from a string
    return str.replace(/<\/?[^>]+>/gi, '');
}


exports.updatelimits = function(userid, callback) {
    var data = {};
    var q2 = "select tracks.date, tracks.time, tracks.gold from tracks where tracks.submiter = " + userid + " and tracks.channel=1 and tracks.unlim=0 and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()"

    var q = "SELECT SUM(tracks.time) as sum," +
        "(select tracks.date from tracks where tracks.submiter = " + userid + " and tracks.channel=1 and tracks.unlim=0 and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW() limit 0,1) as lastime, " +
        "(Select SUM(tracks.time) FROM `tracks` WHERE tracks.submiter = " + userid + " and tracks.channel=1 and tracks.gold=b'1' and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()) as goldsum " +
        "FROM `tracks` WHERE tracks.submiter =" + userid + " and tracks.channel=1 and tracks.unlim=0 and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()";
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            data.time = result[0].sum || 0;
            var goldtime = result[0].goldsum || 0;
            data.time = data.time - goldtime * 2;
            var last = new Date(result[0].lastime);
            if (Date.parse(last) > 0) {
                var now = new Date();
                var shift = new Date((Date.parse(last) + 1000 + (3600 * 12 * 1000)) - Date.parse(now));
                data.next = Date.parse(shift);
            } else {
                data.next = 0;
            }

            callback(data);
        } else {
            callback({'error': error});
        }
    });
    //data.next=0;
    //data.time=0;
    //callback(data);

    /*
     db.connection.query(q2, function(error, result, fields) {
     if (!error) {
     overal = 0;
     lastdate = 0;
     for (var c in result) {
     overal += result[c].time;
     if (result[c].gold[0] == 1) {
     overal -= result[c].time;
     }
     lastdate = result[c].date
     }
     data.time = overal
     var last = new Date(lastdate);
     if (Date.parse(last) > 0) {
     var now = new Date();
     var shift = new Date((Date.parse(last) + 1000 + (3600 * 12 * 1000)) - Date.parse(now));
     data.next = Date.parse(shift);
     } else {
     data.next = 0;
     }
     callback(data);
     } else {
     callback({'error': error});
     }
     });*/
}


function getinvites(id, callback) {
    db.connection.query('SELECT invites.*, users.name FROM invites LEFT JOIN users ON invites.userid=users.id WHERE parentid = ' + id, function(e, result, fields) {
        var invites = { u: [], i: []};
        if (!e) {

            for (var i in result) {
                var invite = {
                    c: result[i].code
                }
                if (new Date(result[i].send_time).getTime() < 0) {
                    invites.i.push(result[i].code);
                } else {
                    if (new Date(result[i].activated_time).getTime() > 0) {
                        invites.u.push({
                            id: result[i].userid,
                            n: result[i].name
                        });
                    }
                }
            }
            db.connection.query('SELECT users.id, users.name FROM users WHERE users.id IN (SELECT invites.parentid from invites where userid=' + id + ');', function(err, r, f) {
                if (!err) {
                    if (r[0]) {
                        invites.p = r[0];
                    }
                }
                callback(invites);
            });

        } else {
            callback(invites);
        }
    });
}

exports.getInvites = function(id, callback) {
    getinvites(id, callback);
}
function getUser(id, callback) {
    db.connection.query('SELECT * FROM users WHERE id = ' + id, function(e, result, fields) {
        if (!e) {
            if (result[0]) {
                var dbrec = result[0];
                var qu = 'SELECT voterid, value, users.name  FROM uservote LEFT JOIN users ON uservote.voterid=users.id WHERE userid=' + dbrec.id;// + ' AND users.lastseen BETWEEN NOW() - INTERVAL 7 DAY AND NOW()';
                db.connection.query(qu, function(error, res, fields) {
                    if (!error) {
                        var us = user.newUser({
                            name: dbrec.name,
                            pass: dbrec.password,
                            id: dbrec.id,
                            country: dbrec.country,
                            city: dbrec.city,
                            regdate: dbrec.regdate,
                            email: dbrec.email,
                            gender: dbrec.gender[0] == 1,
                            votes: res
                        });
                        callback({'user': us});
                    } else {
                        callback({'error': 'database fail'});
                    }
                });

            } else {
                callback({'error': 'nouser'});
            }
        } else {
            callback({'error': 'database fail'});
        }
    });
}
exports.getuser = function(id, callback) {
    getUser(id, callback);
}

exports.getstats = function(userid, callback) {
    /*    db.connection.query('SELECT count(*) as "count" FROM tracks WHERE tracks.submiter=' + userid + ' AND tracks.date BETWEEN NOW() - INTERVAL 7 DAY AND NOW()', function(e, r, fields) {
     var count = r[0].count;
     db.connection.query('select sum(trackvote.value) as "rating" FROM trackvote where trackvote.trackid in (SELECT tracks.id FROM tracks WHERE tracks.submiter=' + userid + ' AND tracks.date BETWEEN NOW() - INTERVAL 7 DAY AND NOW()) AND trackvote.voterid <> ' + userid + ';', function(e, result, fields) {
     var rating = result[0].rating;
     callback({trx: count, rt: (rating / count).toFixed(3)});
     });
     });*/
    callback({trx: 0, rt: 0});
}


exports.login = function(data, callback) {
    var username = sanitizer.escape(data.u);
    var password = sanitizer.escape(data.p);
    db.connection.query('SELECT * FROM users WHERE name = \'' + username + '\'', function(e, result, fields) {
        if (!e) {
            if (result[0]) {
                var dbrec = result[0];
                if (dbrec.password == password) {
                    getUser(dbrec.id, callback);
                    if (data.ip) {
                        var datequery = 'UPDATE users SET lastseen = NOW(), ip= "' + data.ip + '" WHERE id =' + dbrec.id;
                        db.connection.query(datequery, function(re, qresult, qfields) {
                            //newip
                        });
                    }
                } else {
                    callback({'error': 'wrongpass'});
                }
            } else {
                callback({'error': 'nouser'});
            }
        } else {
            callback({'error': 'database fail'});
        }
    });
}


exports.addMessage = function(message) {
    var q = 'INSERT INTO chat (channelid, userid, message,trackid) VALUES (' + message.chid + ',' + message.uid + ',\'' + message.m + '\',' + message.tid + ')';
    db.connection.query(q, function(e, result, fields) {
        if (e) {
        }
    });

}

exports.getMessages = function(id, shift, callback) {
    var q = 'SELECT chat.*, users.name FROM chat LEFT JOIN users ON chat.userid=users.id WHERE date <' + db.connection.escape(shift) + ' AND channelid=' + id + ' ORDER BY date DESC LIMIT 50';
    db.connection.query(q, function(e, result, fields) {
        var data = [];
        for (var m in result) {
            var mes = result[m];
            data.unshift({
                chid: mes.channelid,
                uid: mes.userid,
                uname: mes.name,
                m: mes.message,
                t: mes.date,
                tid: mes.trackid
            })
        }
        callback(data)
    });

}

function getTracksFromQery(q, callback) {
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            var ids = '';
            var tracks = [];
            for (var t in result) {
                tracks.push({
                    a: result[t].artist,
                    t: result[t].title,
                    i: result[t].info,
                    tt: result[t].playdate,
                    s: result[t].name,
                    p: [],
                    n: [],
                    tg: [],
                    id: result[t].id,
                    chid: result[t].channel,
                    sid: result[t].submiter,
                    g: result[t].gold[0] == 1,
                    r: 0
                });
                ids += result[t].id + ',';
            }
            ids = ids.slice(0, -1);
            var q = 'SELECT trackvote.*, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid in (' + ids + ')';
            db.connection.query(q, function(error, result, fields) {
                if (!error) {
                    for (var v in result) {
                        for (var t in tracks) {
                            if (result[v].trackid == tracks[t].id) {
                                var vote = {
                                    'vid': result[v].voterid,
                                    'n': result[v].name,
                                    'v': result[v].value
                                };
                                if (result[v].value > 0) {
                                    tracks[t].p.push(vote);
                                } else {
                                    tracks[t].n.push(vote);
                                }
                                tracks[t].r += result[v].value;
                                break;
                            }
                        }
                    }
                    var req = 'SELECT tracktags.trackid, tracktags.tagid, tags.name FROM tracktags LEFT JOIN tags ON tracktags.tagid=tags.id WHERE trackid in (' + ids + ')';
                    db.connection.query(req, function(err, res, fields) {
                        if (!err) {
                            for (var v in res) {
                                for (var t in tracks) {
                                    var tag = {
                                        'id': res[v].id,
                                        'n': res[v].name
                                    };
                                    if (res[v].trackid == tracks[t].id) {
                                        tracks[t].tg.push(tag);
                                    }
                                }
                            }
                            callback(tracks);
                        }
                    });

                }
            });
        }
    });

}
exports.getVoted = function(id, shift, positive, callback) {
    var p = '<';
    if (positive) {
        p = '>';
    }
    var q = 'SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.id IN (SELECT trackvote.trackid FROM trackvote WHERE trackvote.voterid=' + id + ' and trackvote.value ' + p + ' 0) AND tracks.submiter!=' + id + ' AND tracks.date < ' + db.connection.escape(shift) + ' ORDER BY tracks.date DESC limit 20';
    getTracksFromQery(q, callback);

}
exports.getuploads = function(id, shift, callback) {
    var q = 'SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.submiter=' + id + ' AND tracks.playdate < ' + db.connection.escape(shift) + ' order by tracks.playdate desc LIMIT 20';
    getTracksFromQery(q, callback);
}

exports.getTracksByShift = function(channel, shift, gold, callback) {
    var getgold = '';
    if (gold) {
        getgold = ' AND tracks.gold = 1';
    }
    var q = 'SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.channel=' + channel + ' AND tracks.playdate < ' + db.connection.escape(shift) + getgold + ' order by tracks.playdate desc LIMIT 20';
    getTracksFromQery(q, callback);
}


exports.getChannels = function(callback) {
    var q = 'SELECT channels.*, users.name as prname FROM channels LEFT JOIN users ON channels.prid=users.id';
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            var q = 'SELECT editors.*, users.name FROM editors LEFT JOIN users ON editors.id=users.id;';
            db.connection.query(q, function(error, r, fields) {
                if (!error) {
                    for (var t in result) {
                        result[t].editors = [];
                        for (var v in r) {
                            if (r[v].chid == result[t].id) {
                                var editor = {
                                    id: r[v].id,
                                    name: r[v].name,
                                    post: r[v].post
                                }
                                result[t].editors.push(editor);
                            }
                        }
                    }
                    var req = 'SELECT banned.*, users.name FROM banned LEFT JOIN users ON banned.id=users.id;';
                    db.connection.query(req, function(err, res, fields) {
                        if (!err) {
                            for (var t in result) {
                                result[t].banned = [];
                                for (var v in res) {
                                    if (res[v].chid == result[t].id) {
                                        var ban = {
                                            id: res[v].id,
                                            name: res[v].name,
                                            reason: res[v].reason
                                        };
                                        result[t].banned.push(ban);
                                    }
                                }
                            }
                            callback(result);
                        }
                    });
                }
            });
        }
    });
}
function processUserVote() {
    if (!uvprocess) {
        uvprocess = true;
        if (uvoteq.length > 0) {
            var vote = uvoteq.pop();
            if (vote.v) {
                var q = 'SELECT * FROM uservote WHERE uservote.userid = \'' + vote.id + '\' AND uservote.voterid = \'' + vote.user.id + '\'';
                db.connection.query(q, function(e, result, fields) {
                    if (!e) {
                        if (result.length > 0) {
                            var qq = 'UPDATE uservote SET value = \'' + vote.v + '\' WHERE uservote.userid = \'' + vote.id + '\' AND voterid = \'' + vote.user.id + '\'';
                            db.connection.query(qq, function(e, result, fields) {
                                uvprocess = false;
                                processVote();
                            });
                        } else {
                            var qq = 'INSERT INTO uservote VALUES (\'' + vote.id + '\', \'' + vote.user.id + '\', \'' + vote.v + '\', NULL, NULL)';
                            db.connection.query(qq, function(e, result, fields) {
                                uvprocess = false;
                                processUserVote();
                            });
                        }
                    } else {
                        uvprocess = false;
                        processUserVote();
                    }
                });
            } else {
                var q = 'DELETE FROM uservote WHERE uservote.userid = \'' + vote.id + '\' AND uservote.voterid = \'' + vote.user.id + '\' LIMIT 1';
                db.connection.query(q, function(error, result, fields) {
                    uvprocess = false;
                    processUserVote();
                });
            }
        } else {
            uvprocess = false;
        }
    }

}
function processVote() {
    if (!vprocess) {
        vprocess = true;
        if (voteq.length > 0) {
            var vote = voteq.pop();
            if (vote.v) {
                var q = 'SELECT * FROM trackvote WHERE trackvote.trackid = \'' + vote.id + '\' AND trackvote.voterid = \'' + vote.user.id + '\'';
                db.connection.query(q, function(e, result, fields) {
                    if (!e) {
                        if (result.length > 0) {
                            var qq = 'UPDATE trackvote SET value = \'' + vote.v + '\' WHERE trackvote.trackid = \'' + vote.id + '\' AND voterid = \'' + vote.user.id + '\'';
                            db.connection.query(qq, function(e, result, fields) {
                                vprocess = false;
                                processVote();
                            });
                        } else {
                            var qq = 'INSERT INTO trackvote VALUES (\'' + vote.id + '\', \'' + vote.user.id + '\', \'' + vote.v + '\', NULL, NULL)';
                            db.connection.query(qq, function(e, result, fields) {

                                vprocess = false;
                                processVote();
                            });
                        }
                    } else {
                        vprocess = false;
                        processVote();
                    }
                });
            } else {
                var q = 'DELETE FROM trackvote WHERE trackvote.trackid = \'' + vote.id + '\' AND trackvote.voterid = \'' + vote.user.id + '\' LIMIT 1';
                db.connection.query(q, function(error, result, fields) {
                    vprocess = false;
                    processVote();
                });
            }
        } else {
            vprocess = false;
        }
    }
}

exports.addVote = function(vote) {
    voteq.push(vote);
    processVote();

}
exports.addUserVote = function(vote) {
    uvoteq.push(vote);
    processUserVote();

}
exports.addTrack = function(track, callback) {
    track.artist = sanitizer.escape(track.artist);
    track.title = sanitizer.escape(track.title);
    track.info = sanitizer.sanitize(track.info, uriPolicy, nmTokenPolicy);
    db.connection.query('INSERT INTO tracks VALUES (NULL, ?, ?, 0, ?, ?, ?, ?, ?, NOW(), NULL,?)',
        [track.path,
            track.channel,
            track.artist,
            track.title,
            track.time,
            track.submiter,
            track.info, track.unlim],
        function(err, result) {
            if (!err) {
                track.id = result.insertId;
                var ids = [];
                var tids = [];
                if (track.tags.length) {
                    var q = 'INSERT INTO tracktags (trackid, tagid) VALUES';
                    for (var t in track.tags) {
                        if (t > 0) {
                            q += ','
                        }
                        q += '(' + track.id + ',' + track.tags[t].id + ')';
                    }
                    db.connection.query(q, function(e, result, fields) {
                        callback();
                    });
                } else {
                    callback();
                }
            }
        }
    );

}
exports.setPlayDate = function(id, time) {
    var q = 'UPDATE tracks SET playdate = DATE_SUB(NOW(), INTERVAL ' + time + ' SECOND) WHERE id =' + id;
    db.connection.query(q, function(error, result, fields) {
    });
}
exports.setGold = function(id, time) {
    var q = "UPDATE tracks SET gold = b'1' WHERE id =" + id;
    db.connection.query(q, function(error, result, fields) {
    });
}
exports.removeTrack = function(id, callback) {
    var q = 'DELETE FROM tracks WHERE id in (' + id + ')';
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            callback();
        }
    });
}
exports.getTracks = function(paths, callback) {
    var ps = '"' + paths.join('","') + '"';
    var q = 'SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE path in (' + ps + ') and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW() order by tracks.date desc';
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            var ids = '';
            for (var t in result) {
                result[t].positive = [];
                result[t].negative = [];
                result[t].tags = [];
                result[t].rating = 0;
                result[t].gold = result[t].gold[0] == 1;
                var ar = result[t].path.split('/')
                result[t].path = ar[ar.length - 1];
                ids += result[t].id + ',';
            }

            ids = ids.slice(0, -1);
            var tracks = result;
            var q = 'SELECT trackvote.*, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid in (' + ids + ')';
            db.connection.query(q, function(error, result, fields) {
                if (!error) {
                    for (var v in result) {
                        for (var t in tracks) {
                            if (result[v].trackid == tracks[t].id) {
                                var vote = {
                                    'voterid': result[v].voterid,
                                    'name': result[v].name,
                                    'value': result[v].value
                                };
                                if (result[v].value > 0) {
                                    tracks[t].positive.push(vote);
                                } else {
                                    tracks[t].negative.push(vote);
                                }
                                tracks[t].rating += result[v].value;
                                break;
                            }
                        }
                    }
                    var req = 'SELECT tracktags.trackid, tracktags.tagid, tags.name FROM tracktags LEFT JOIN tags ON tracktags.tagid=tags.id WHERE trackid in (' + ids + ')';
                    db.connection.query(req, function(err, res, fields) {
                        if (!err) {
                            for (var v in res) {
                                for (var t in tracks) {
                                    var tag = {
                                        'id': res[v].id,
                                        'n': res[v].name
                                    };
                                    if (res[v].trackid == tracks[t].id) {
                                        tracks[t].tags.push(tag);
                                    }
                                }
                            }
                            callback(tracks);
                        }
                    });
                }
            });
        }
    });

}

exports.getTags = function(string, callback) {
    var str = strip_tags(string);
    if (str.length != string.length) {
        callback({error: "not valid tag"});
        return;
    }
    string = sanitizer.sanitize(string, uriPolicy, nmTokenPolicy);
    var q = 'SELECT * FROM tags WHERE name LIKE \'%' + string + '%\'';
    db.connection.query(q, function(error, result, fields) {
        if (!error) {
            var data = {t: []}
            for (var r in result) {
                var res = result[r];
                data.t.push({id: res.id, n: res.name});
            }
            callback(data);
        } else {
            callback({error: 'db fail'});
        }
    });

}

exports.getTag = function(string, callback) {
    var str = strip_tags(string);
    if (str.length != string.length) {
        return;
    }
    string = sanitizer.sanitize(string, uriPolicy, nmTokenPolicy);
    var q = 'SELECT * FROM tags WHERE name ="' + string + '"';
    db.connection.query(q, function(error, result, fields) {
        if (!error && result.length > 0) {
            var data = {};
            var res = result[0];
            data.t = {id: res.id, n: res.name};
            callback(data);
        } else {
            callback({error: 'db fail'});

        }
    });

}

exports.addTag = function(string, callback) {
    var str = strip_tags(string);
    if (str.length != string.length) {
        callback({error: "not valid tag"});
        return;
    }
    string = sanitizer.sanitize(string.toLowerCase(), uriPolicy, nmTokenPolicy);
    if (string && string.length > 0) {
        this.getTag(string, function(data) {
            if (data.t) {
                callback({id: data.t.id, n: data.t.n});
            } else {
                var q = 'INSERT INTO `tags` (`id`, `name`) VALUES (null, \'' + string + '\')';
                db.connection.query(q, function(error, result, fields) {
                    if (!error) {
                        callback({id: result.insertId, n: string});
                    } else {
                        callback({error: 'db fail'});
                    }
                });
            }
        });
    }
    else {
        callback({error: 'not valid tag'});
    }

}

exports.addTrackTag = function(track, tag, callback) {
    db.connection.query('INSERT INTO tracktags (trackid, tagid) VALUES (' + track.id + ',' + tag.id + ')', function(e, result, fields) {
        callback();
    });
}


exports.sendinvite = function(code, mail, socket) {
    exec('php /home/trigger/node/sendmail.php ' + mail + ' ' + code, function(error, stdout, stderr) {
        if (!error) {
            db.connection.query('UPDATE invites SET  email="' + mail + '", send_time=NOW() WHERE  code = "' + code + '" LIMIT 1', function(error, result, fields) {
                if (error) {
                    socket.emit('invitestatus', {ok: false, m: mail});
                }
                if (result) {
                    socket.emit('invitestatus', {ok: true, m: mail});
                }
            });
        } else {
            socket.emit('invitestatus', {ok: false, m: mail});
        }
    });
}

exports.recoverpass = function(mail, callback) {
    mail = sanitizer.sanitize(mail);
    db.connection.query('SELECT * FROM users WHERE email = \'' + mail + '\'', function(err, result, fields) {
        if (!err) {
            if (result[0]) {
                var pass = md5("pass" + Math.random() * 100000000000 + new Date().getTime() + "a").substring(3, 9);
                var code = md5(pass);
                db.connection.query('UPDATE users SET  password="' + code + '" WHERE  email = "' + mail + '" LIMIT 1', function(error, r, fields) {
                    if (error) {
                        callback({ok: false, e: 'db fail'});
                    }
                    if (r) {
                        exec('php /home/trigger/node/sendpass.php ' + result[0].email + ' ' + result[0].name + ' ' + pass, function(error, stdout, stderr) {
                            if (!error) {
                                callback({ok: true, m: 'Привет, ' + result[0].name + ' на твой ящик ' + result[0].email + ' отправлен новый пароль ;)'});
                            } else {
                                callback({ok: false, e: 'sending mail fail'});
                            }
                        });

                    }
                });
            } else {
                callback({ok: false, e: 'no user'});
            }
        } else {
            callback({ok: false, e: 'db fail'});
        }
    });


}

exports.changeuserpass = function(id, pass, callback) {
    var newpass = sanitizer.sanitize(pass);
    db.connection.query('UPDATE users SET password ="' + newpass + '" WHERE id = ' + id, function(err, result, fields) {
        if (!err) {
            callback({ok: true});
        } else {
            callback({ok: false, e: err});
        }
    });


}
exports.changeuserdata = function(user) {
    var g = 0;
    if (user.gender) {
        g = 1;
    }
    db.connection.query('UPDATE users SET gender =' + g + ' WHERE id = ' + user.id, function(err, result, fields) {
    });
}
exports.generateinvite = function(userid) {
    var code = md5("sds" + Math.random() * 100000000000 + new Date().getTime() + "a");
    db.connection.query('insert into invites (parentid, code, give_time, userid) VALUES (' + userid + ', "' + code + '", NOW(), 0)', function(error, result, fields) {
    });
}
exports.banuser = function(data) {
    console.log('to base - ', data);
    db.connection.query('insert into banned (id, chid, reason) VALUES (' + data.id + ', ' + data.chid + ',"' + data.r + '")', function(error, result, fields) {
        console.log(error);
    });
}
exports.unbanuser = function(data) {
    console.log('to base - ', data);
    db.connection.query('DELETE FROM banned WHERE id = ' + data.id + ' AND chid = ' + data.chid + ' LIMIT 1;', function(error, result, fields) {
        console.log(error);
    });
}

exports.setpr = function(data) {
    console.log('to base - ', data);
    db.connection.query('UPDATE channels SET prid = ' + data.id + ' WHERE `id` = ' + data.chid + ';', function(error, result, fields) {
        console.log(error);
    });
}

exports.setop = function(data, callback) {
    db.connection.query('INSERT INTO editors (id, chid, post) VALUES (' + data.id + ', ' + data.chid + ', "' + data.post + '");', function(error, result, fields) {
        callback(error);
    });
}
exports.replaceop = function(data) {
    db.connection.query('UPDATE editors SET post = "' + data.post + '" WHERE `id` = ' + data.id + ' AND chid=' + data.chid + ';', function(error, result, fields) {
        console.log(error);
    });
}
exports.removeop = function(data) {
    db.connection.query('DELETE FROM editors WHERE id = ' + data.id + ' AND chid = ' + data.chid + ';', function(error, result, fields) {
        console.log(error);
    });
}
exports.savechannelstate = function(data, callback) {
    if (data.description) {
        db.connection.query('UPDATE channels SET description = ' + mysql.escape(data.description) + ' WHERE `id` = ' + data.chid + ';', function(error, result, fields) {
            var bddata = {};
            if (error) {
                bddata.error = error;
            }
            console.log(bddata);
            callback(bddata);
        });
    }
}

