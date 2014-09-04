var db = require('./db.local.js');
var user = {};
var track = {};
var tag = {};

function getTracksData(callback) {
    var q = 'SELECT * FROM trackvote';
    db.connection.query(q, function(error, result, fields) {
            if (!error) {
                for (var v in result) {
                    var vote = {
                        'voter': user[result[v].voterid],
                        'v': result[v].value
                    };
                    tr = track[result[v].trackid];
                    if (vote.voter && tr) {
                        if (result[v].value > 0) {
                            tr.p.push(vote);
                        } else {
                            tr.n.push(vote);
                        }
                        tr.r += result[v].value;
                    }

                }
                var req = 'SELECT tracktags.trackid, tracktags.tagid, tags.name FROM tracktags LEFT JOIN tags ON tracktags.tagid=tags.id';
                db.connection.query(req, function(err, res, fields) {
                    if (!err) {
                        console.log(res[0]);
                        for (var v in res) {
                            var tt = track[res[v].trackid];
                            if (tt) {
                                if (!tag[res[v].tagid]) {
                                    tag[res[v].tagid] = {
                                        'id': res[v].id,
                                        'n': res[v].name
                                    };
                                }
                                tt.tg.push(tag[res[v].tagid]);
                            }
                        }
                        callback();
                    }
                });

            }
        }
    );

}


function getTracks(callback) {
    var q = 'SELECT * FROM tracks order by tracks.playdate desc';
    console.log('getting tracks...');
    var overal = 0;
    db.connection.query(q, function(er, trackres, ff) {
        if (!er) {
            console.log('found ', trackres.length, ' tracks');
            var stat = 0;
            for (var t in trackres) {
                track[trackres[t].id] = {
                    a: trackres[t].artist,
                    t: trackres[t].title,
                    i: trackres[t].info,
                    d: trackres[t].date,
                    tt: trackres[t].playdate,
                    time: trackres[t].time,
                    s: trackres[t].name,
                    p: [],
                    n: [],
                    tg: [],
                    id: trackres[t].id,
                    chid: trackres[t].channel,
                    submiter: user[trackres[t].submiter],
                    g: trackres[t].gold[0] == 1,
                    r: 0
                }
                overal += track[trackres[t].id].time;
                if (user[trackres[t].submiter]) {
                    user[trackres[t].submiter].tracks.push[track[trackres[t].id]];
                }
                var proc = Math.round((t / trackres.length) * 10);

                if (proc != stat) {
                    stat = proc;
                    console.log(stat + '0%');
                    console.log('overal ' + overal / 60);
                }
            }
            callback();
        }

    });

}

function getUserVotes(callback) {
    var qu = 'SELECT * FROM uservote';// + ' AND users.lastseen BETWEEN NOW() - INTERVAL 7 DAY AND NOW()';
    db.connection.query(qu, function(error, res, f) {
        if (!error) {
            for (var x in res) {
                var u = user[res[x].userid];
                if (u) {
                    u.karma += res[x].value;
                    u.votes.push({
                        voter: user[res[x].voterid],
                        value: res[x].value
                    });
                }
            }
            callback();
        }
    });
}

exports.parseDB = function(callback) {
    db.connection.query('SELECT * FROM users', function(e, result, fields) {
        if (!e) {
            if (result) {

                for (var i in result) {

                    user[result[i].id] = {
                        id: result[i].id,
                        name: result[i].name,
                        password: result[i].password,
                        email: result[i].email,
                        regdate: result[i].regdate,
                        gender: result[i].gender == 1,
                        country: result[i].country,
                        city: result[i].city,
                        karma: 0,
                        votes: [],
                        tracks: [],
                        lastseen: result[i].lastseen,
                        ip: result[i].ip
                    }
                }
                getUserVotes(function() {
                    getTracks(function() {
                        getTracksData(function() {
                            callback({'users': user, 'tracks': track, 'tags': tag});
                        });
                    });
                });
            }

        }
    });
}

exports.getUser = function(id, callback) {
    var du = user[id];
    var u = {id: du.id,
        name: du.name,
        regdate: du.regdate,
        karma: du.karma,
        gender: du.gender
    }
    callback(u);
}

exports.getTrack = function(id, callback) {
    var dt = track[id];
    var tr = {id: dt.id,
        a: dt.a,
        t: dt.t,
        i: dt.i,
        r: dt.r,
        g: dt.g
    }
    callback(tr);
}