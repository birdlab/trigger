var utils = require('./utils.js');
var tester = require('./tester.js');
var chat = require('./chat.js');
var log = require('./log.js');
var db = require('./dbdata.js');
var exec = require("child_process").exec;
var main = require('../trigger.js');
var sockets = require('./sockets.js');
var san = require('sanitizer');

function Channel(i) {
    console.log(i);
    this.id = i.id;
    this.port = i.port;
    this.name = i.name;
    this.prid = i.prid;
    this.prname = i.prname;
    this.editors = i.editors;
    this.banned = i.banned;
    this.banlist = [];
    this.description = i.description;
    this.hilink = i.hilink;
    this.lowlink = i.lowlink;
    this.playlist = [];
    this.current = false;
    this.next = false;
    this.chat = chat.newChat(this.id);
    this.currentTime = 0;
    this.overalTime = 0;
    this.processing = false;
    this.query = [];
    this.listeners = 0
    this.init();
    this.playing = true;
    this.chip = [];
    this.active = 0;
    this.election = false;
    this.electionData = {};
    this.weightrate = 10;
    var ch = this;
    setTimeout(function() {
        ch.checkFile();
    }, 4000);
    setInterval(function() {
        ch.status();
    }, 5000);
    setInterval(function() {
        ch.guard();
    }, 5000);
    setInterval(function() {
        ch.timecontrol();
    }, 1000);

}

Channel.prototype.init = function(id) {
    var command = '';
    var ch = this;
    id = ch.id;

    if (ch.id == 1) {
        command = 'mpd --no-daemon /home/trigger/mpd/mpd.conf';
    } else {
        command = 'mpd --no-daemon /home/trigger/mpd/' + ch.name + '/mpd.conf';
    }
    if (!ch.chat) {
        ch.chat = chat.newChat(ch.id);
    }
    console.log('starting', id);
    exec(command, function(error, stdout, stderr) {
        console.log(ch, ' > ', error);
        setTimeout(ch.init(ch.id), 5000);
    });


    exec('date -R', function(error, stdout, stderr) {
        if (stdout.search('Wed') > -1) {
            ch.startElection();
        } else {
            console.log('no election');
        }
    });
    console.log(this.banned);
}

Channel.prototype.setop = function(data, callback) {
    var ch = this;
    if (data.pr) {
        main.getuser(data.id, function(user) {
            console.log('set new PR', user.name);
            if (user) {
                var olduser = main.getuser(ch.prid);
                if (olduser) {
                    olduser.prch = false;
                }
                user.prch = ch.id;
                ch.prid = data.id;
                ch.prname = user.name;
                db.setpr(data);
                if (callback) {
                    callback({id: data.id, name: user.name, chid: ch.id});
                }
            }
        });
    } else {
        if (!data.post) {
            data.post = 'редактор';
        }
        data.post = san.sanitize(data.post);
        var e = false;
        for (var c in main.channels) {
            var channel = main.channels[c];
            for (var o in channel.editors) {
                if (channel.editors[o].id == data.id) {
                    if (main.channels[c].id != data.chid) {
                        if (!e) {
                            e = 'another';
                            if (callback) {
                                callback({error: e});
                            }
                        }
                    } else {
                        if (e) {
                            e = 'changed';
                            channel.editors[o].post = data.post;
                            db.replaceop(data);
                            if (callback) {
                                callback({editors: ch.editors});
                            }
                        }
                    }
                }

            }
        }
        if (!e) {
            if (ch.editors.length < 5) {
                main.getuser(data.id, function(user) {
                    if (user) {
                        db.setop(data, function(error) {
                            if (!error) {
                                var editor = {
                                    id: data.id,
                                    name: user.name,
                                    post: data.post
                                }
                                user.opch = ch.id;
                                ch.editors.push(editor);
                                if (callback) {
                                    callback({editors: ch.editors});
                                }
                            }
                        });

                    }
                });
            } else {
                e = 'overload';
                if (callback) {
                    callback({error: e});
                }
            }
        }
    }
}


Channel.prototype.removeop = function(data, callback) {
    var ch = this;
    for (var e in ch.editors) {
        if (ch.editors[e].id == data.id) {
            ch.editors.splice(e, 1);
            db.removeop(data);
            if (callback) {
                callback({editors: ch.editors});
            }
            break;
        }
    }

}

Channel.prototype.setprops = function(channeldata, callback) {
    var ch = this;
    console.log('channeldata ', channeldata);
    var data = {chid: ch.id};
    if (channeldata.rate) {
        data.rate = channeldata.rate;
    }
    if (channeldata.limit) {
        data.limit = channeldata.limit;
    }
    if (channeldata.description) {
        data.description = channeldata.description;
        ch.description = channeldata.description;
    }
    db.savechannelstate(data, callback);
}

Channel.prototype.banuser = function(data, callback) {
    var ch = this;
    if (data.id) {
        main.getuser(data.id, function(user) {
            if (user) {
                if (!ch.isbanned(data.id)) {
                    if (!data.time) {
                        data.time = 1;
                    }
                    var bt = new Date(Date.now() + (3600000 * data.time) + 10800000);
                    console.log(bt);
                    data.r = san.sanitize(data.r);
                    var newbanned = {
                        id: data.id,
                        chid: ch.id,
                        name: user.name,
                        bantime: bt,
                        killerid: data.killerid,
                        killername: data.killername,
                        reason: data.r
                    }
                    ch.banned.push(newbanned);
                    db.banuser(newbanned);
                    callback({banned: ch.banned});
                } else {
                    callback({error: 'in'});
                }
            }
        });
    }


}

Channel.prototype.unbanuser = function(data, callback) {
    var ch = this;
    if (data.id) {
        var is = ch.isbanned(data.id);
        if (is) {
            ch.banned.splice(is.index, 1);
            db.unbanuser(data);
            callback({banned: ch.banned});
        } else {
            callback({error: 'no'});
        }
    }
}

Channel.prototype.isbanned = function(id) {
    var ch = this;
    for (var b in ch.banned) {
        if (ch.banned[b].id == id) {
            return {index: b};
        }
    }
    return false;
}

Channel.prototype.getPlaylist = function() {
    var ch = this;
    var cdata = {};
    var plist = [];
    for (var t in ch.playlist) {
        plist.push(packTrackData(ch.playlist[t]));
    }
    if (ch.current) {
        cdata = packTrackData(ch.current);
    } else {
        cdata = null;
    }
    var data = {
        'chid': ch.id,
        'pls': plist,
        'ct': ch.currentTime,
        'current': cdata
    };
    return data;
}

Channel.prototype.getCurrent = function() {
    var ch = this;
    if (ch.current) {
        var data = packTrackData(ch.current);
    }
    return data;
}

function uniq(a) {
    var n = [];
    for (var i in a) {
        var ip = a[i];
        var u = true;
        for (var f in n) {
            if (!(ip != n[f])) {
                u = false;
            }
        }
        if (u) {
            n.push(ip);
        }
    }
    return n;
}


Channel.prototype.updateTracks = function() {
    var ch = this;
    for (var i in ch.playlist) {
        var track = ch.playlist[i];
        var oldrating = track.rating;
        track.rating = 0;
        for (var p in track.positive) {
            var vote = track.positive[p];
            for (var s in this.chat.chatsockets) {
                var user = this.chat.chatsockets[s].user;
                if (user) {
                    if (vote.voterid == user.id) {
                        vote.active = this.chat.chatsockets[s].active
                    }
                    if (vote.active) {
                        track.rating += vote.value;
                    }
                    break;
                }
            }
        }
        for (var p in track.negative) {
            var vote = track.negative[p];
            for (var s in this.chat.chatsockets) {
                var user = this.chat.chatsockets[s].user;
                if (user) {
                    if (vote.voterid == user.id) {
                        vote.active = this.chat.chatsockets[s].active
                    }
                    if (vote.active) {
                        track.rating += vote.value;
                    }
                    break;
                }
            }
        }
        if (oldrating != track.rating) {
            sockets.sendUpdateTrack({'chid': ch.id, 't': packTrackData(track)});
        }

    }
}


Channel.prototype.status = function() {
    var ch = this;
    exec('php /home/trigger/node/fastinfo.php ' + ch.hilink + ' ' + ch.lowlink, function(error, stdout, stderr) {
        if (!error) {
            var ips = stdout.replace(String.fromCharCode(65279), '').split(',');
            ips.pop();
            ips = uniq(ips);
            if (ch.chip.length != ips.length) {
                ch.chip = ips;
                ch.active = 0;
                if (ch.listeners != ips.length) {
                    ch.listeners = ips.length;
                    for (var u in ch.chat.users) {
                        var user = ch.chat.users[u];
                        var active = false;
                        for (var s in user.sockets) {
                            var socket = sockets.getid(user.sockets[s]);
                            if (!socket.active) {
                                for (var i in ips) {
                                    if (!(ips[i] != socket.ip)) {
                                        socket.active = true;
                                        if (!active) {
                                            active = true;
                                            sockets.sendUserStatus({'chid': ch.id, n: user.name, uid: user.id, a: socket.active});
                                        }
                                    }
                                }
                            } else {
                                var still = false;
                                for (var i in ips) {
                                    if (!(ips[i] != socket.ip)) {
                                        still = true;
                                    }
                                }
                                if (!still) {
                                    socket.active = false;
                                    sockets.sendUserStatus({'chid': ch.id, n: user.name, uid: user.id, a: socket.active});
                                }
                            }
                        }
                    }
                    ch.active = ch.chat.getActive();
                    sockets.sendListners({'chid': ch.id, 'l': ips.length, 'a': ch.active});
                    //ch.updateTracks();
                }
            }
        } else {
            console.log('status check error', error);
        }
    });
}

Channel.prototype.guard = function() {
    var ch = this;
    if (ch.playing) {
        exec('mpc -p ' + ch.port + ' -f %time%  play', function(error, stdout, stderr) {
            if (!error) {
                var ans = stdout.split('\n');
                if (ans[1].substring(0, 9) != '[playing]') {
                    ch.pushNext(function() {
                        ch.play();
                    });
                }
            } else {
                console.log(error);
            }
        });
    }
}

Channel.prototype.pushNext = function(callback) {
    var ch = this;
    if (ch.current) {
        ch.processTrack(ch.current);
    }
    if (ch.playlist.length > 0) {
        ch.current = ch.playlist.shift();
        ch.processing = true;
        exec('mpc -p ' + ch.port + ' clear', function(error, stdout, stderr) {
            if (!error) {
                exec('mpc -p ' + ch.port + ' update', function(error, stdout, stderr) {
                    if (!error) {
                        exec('mpc -p ' + ch.port + ' add "' + ch.current.path + '"', function(error, stdout, stderr) {
                            if (!error) {
                                ch.processing = false;
                                ch.play();
                                currentTime = 0;
                                sockets.sendNewCurrent({'chid': ch.id, 'track': packTrackData(ch.current)});
                                ch.setNext();
                                if (callback) {
                                    callback();
                                }
                            } else {
                                ch.processing = false;
                            }
                        });
                    } else {
                        ch.processing = false;

                    }
                });
            } else {
                ch.processing = false;
            }
        });
    }
}

Channel.prototype.timecontrol = function() {
    ch = this;
    ch.currentTime += 1;
    if (ch.current.live) {
        ch.current.time = ch.currentTime;
        var user = main.user(ch.current.submiter);
        if (user) {
            if (ch.current.time > user.time) {
                ch.skip();
            }
        }
    } else {
        if (ch.currentTime > ch.current.time && !ch.playlist.length > 0) {
            ch.currentTime = 0;
            sockets.sendNewCurrent({'chid': ch.id, 'track': packTrackData(ch.current)});
        }
    }
}

Channel.prototype.checkFile = function() {
    var ch = this;
    exec('mpc -p ' + ch.port + ' current --wait', function(error, stdout, stderr) {
        if (!error) {
            if (ch.current && ch.playlist.length > 0) {
                ch.processTrack(ch.current);
                ch.current = ch.playlist.shift();
            }
            ch.currentTime = 0;
            sockets.sendNewCurrent({'chid': ch.id, 'track': packTrackData(ch.current)});
            ch.setNext();
            setTimeout(function() {
                ch.checkFile();
            }, 5000);
        } else {
            setTimeout(function() {
                ch.checkFile();
            }, 5000);
        }
    });
}


Channel.prototype.addTrack = function(data, callback) {
    var track = data;
    var ch = this;
    var is = false;
    for (var t in ch.playlist) {
        if (ch.playlist[t].path == track.path) {
            is = true;
            if (callback) {
                callback({'error': 'in'});
            }
            break;
        }
    }
    if (!is && !ch.isbanned(track.submiter)) {
        process_track = function(ans) {
            if (ans) {
                track.time = ans;
                if (track.id) {
                    track.date = new Date(Date.parse(track.date) + 10800000);
                    ch.playlist.push(track);
                    ch.sort();
                    if (!ch.current && ch.playlist.length > 0) {
                        ch.pushNext();
                    }
                    sockets.sendAddTrack({'chid': ch.id, 'track': packTrackData(track)});
                } else {
                    var user = main.user(track.submiter);
                    if (user) {
                        if (user.time > track.time || ch.chat.users.length < 11 || ch.id != 1 || ch.playlist.length < 11) {
                            ch.playlist.push(track);
                            track.channel = ch.id;
                            track.unlim = 0;
                            if ((ch.chat.users.length < 11 || ch.playlist.length < 10) && ch.id == 1) {
                                track.unlim = 1;
                            }
                            track.artist = san.sanitize(track.artist);
                            track.title = san.sanitize(track.title);
                            track.info = san.sanitize(track.info);
                            db.addTrack(track, function() {
                                track.rating = 0;
                                track.date = new Date(Date.now() + 10800000);
                                track.positive = [];
                                track.negative = [];
                                var weight = user.fastinfo().w;
                                console.log('user weight - ' + weight);
                                if (track.vote) {
                                    console.log('track.vote - ' + track.vote);
                                    track.vote = parseInt(track.vote);
                                    console.log('after parse - ' + track.vote);
                                    console.log('track.vote > weight - ' + track.vote > weight);
                                    if (!(track.vote > weight)) {
                                        weight = track.vote;
                                    } else {
                                        weight = 0;
                                    }
                                }
                                console.log('result vote ' + weight);
                                if (weight) {
                                    ch.addVote({'track': track.id, 'user': user, 'v': weight, inside: true, 'fulltrack': track}, function() {
                                        ch.sort();
                                        if (!ch.current && ch.playlist.length > 0) {
                                            ch.pushNext();
                                        }
                                        if (callback) {
                                            callback({'ok': true });
                                        }
                                        sockets.sendAddTrack({'chid': ch.id, 'track': packTrackData(track)});
                                        user.updateLimits();
                                    });
                                } else {
                                    ch.sort();
                                    if (!ch.current && ch.playlist.length > 0) {
                                        ch.pushNext();
                                    }
                                    if (callback) {
                                        callback({'ok': true });
                                    }
                                    sockets.sendAddTrack({'chid': ch.id, 'track': packTrackData(track)});
                                    user.updateLimits();
                                }
                            });
                        } else {
                            if (callback) {
                                callback({'error': 'Огорчение! Трек оказался длиннее лимита ('});
                            }
                            killfile(track.path);
                        }
                    } else {
                        if (callback) {
                            callback({'error': 'Ошибка получения данных пользователя'});
                        }
                        killfile(track.path);
                    }
                }

            } else {
                if (callback) {
                    callback({'error': 'Трек не удалось протестировать. Возможно русские буквы в начале названия файла.'});
                }
                killfile(track.path);
            }
        }
        if (track.live) {
            process_track(1);
        } else {
            tester.test(track.path, process_track);
        }
    }
}

Channel.prototype.track = function(id) {
    if (this.current.id == id) {
        return this.current;
    }
    for (var t in this.playlist) {
        if (this.playlist[t].id == id) {
            return this.playlist[t];
        }
    }
}

Channel.prototype.updateTrack = function(data) {
    var ch = this;
    if (data) {
        if (data.id) {
            track = ch.track(data.id);
            if (track) {
                if (data.a) {
                    track.artist = san.sanitize(data.a);
                }
                if (data.t) {
                    track.title = san.sanitize(data.t);
                }
                if (data.i) {
                    track.info = san.sanitize(data.i);
                }
                if (data.time) {
                    track.time = data.time;
                }
                db.updateTrack(track);
                sockets.sendUpdateTrack({'chid': ch.id, 't': packTrackData(track)});
            }
        }
    }

}

Channel.prototype.addVote = function(data, callback) {
    var ch = this;
    var addv = function() {
        if (data.v != 0) {
            var newvote = {
                'value': data.v,
                'voterid': data.user.id,
                'name': data.user.name
            }
            if (data.v > 0) {
                track.positive.push(newvote);
            } else {
                track.negative.push(newvote);
            }

        }
        var rating = 0;
        for (var i in track.positive) {
            rating += track.positive[i].value;
        }
        for (var i in track.negative) {
            rating += track.negative[i].value;
        }
        track.rating = rating;
        if (track.rating < -9 || (track.positive.length < track.negative.length && track.negative.length > 2)) {
            if (track.id == ch.current.id) {
                ch.skip();
            } else {
                ch.killTrack(track.id);
            }
        }
    }


    var findvote = function(track, userid) {
        for (var i in track.positive) {
            if (track.positive[i].voterid == userid) {
                return {'group': track.positive, 'index': i, 'vote': track.positive[i]};
            }
        }
        for (var i in track.negative) {
            if (track.negative[i].voterid == userid) {
                return {'group': track.negative, 'index': i, 'vote': track.negative[i]};
            }
        }
        return false;
    }
    var track = null;
    if (data.fulltrack) {
        track = data.fulltrack
        data.id = track.id;
    } else {
        track = ch.track(data.id);
    }
    if (data.id) {
        if (track) {

            data.v = Number(data.v);
            if (data.v | 0 === data.v) {
                if (Math.abs(data.v) <= data.user.weight || data.user.prch == ch.id || data.user.opch == ch.id) {
                    var vdata = findvote(track, data.user.id);
                    if (vdata) {
                        if (vdata.value != data.v) {
                            vdata.group.splice(vdata.index, 1);
                            addv();
                            if (!data.inside) {
                                ch.sort();
                                sockets.sendUpdateTrack({'chid': ch.id, 't': packTrackData(track)});
                            }
                        }
                    } else {
                        addv();
                        if (!data.inside) {
                            ch.sort();
                            sockets.sendUpdateTrack({'chid': ch.id, 't': packTrackData(track)});
                        }
                    }
                    db.addVote(data);
                }
            }

        }
    }
    if (callback) {
        callback();
    }
}

Channel.prototype.processTrack = function(track) {
    var ch = this;
    if (track.live) {
        db.setLiveTime(track.id, track.time);
    }
    db.setPlayDate(track.id, track.time);
    if (ch.active > 9) {
        if ((track.positive.length / ch.active) > 0.8 && track.negative.length < 3) {
            db.setGold(track.id);
            db.generateinvite(track.submiter);
            var submiter = main.user(track.submiter);
            if (submiter) {
                submiter.updateLimits();
            }
        }
    }
    if (!ch.election) {
        exec('date -R', function(error, stdout, stderr) {
            if (stdout.search('Wed') > -1) {
                ch.startElection();
            }
        });
    } else {
        exec('date -R', function(error, stdout, stderr) {
            if (stdout.search('Wed') < 0) {
                ch.stopElection();
            }
        });
    }
    killfile(track.path);
}

Channel.prototype.sortElection = function() {
    var ch = this;
    var i = ch.electionData.candidates.length;
    while (i--) {
        if (ch.electionData.candidates[i].votes.length == 0) {
            ch.electionData.candidates.splice(i, 1);
        }
    }
    ch.electionData.candidates.sort(function(a, b) {
        if (a.votes.length > b.votes.length) {
            return -1;
        }
        if (a.votes.length < b.votes.length) {
            return 1
        }
        return 0
    });
}

Channel.prototype.startElection = function() {
    var ch = this;
    ch.election = true;
    console.log('election started');
    db.startElection({channel: ch.id}, function(data) {
        ch.electionData = {candidates: []};
        if (data.status == 'active') {
            for (var i in data.votes) {
                var vote = data.votes[i];
                var is = false;
                for (var j in ch.electionData.candidates) {
                    if (ch.electionData.candidates[j].user.id == vote.prid) {
                        ch.electionData.candidates[j].votes.push(vote.voterid);
                        is = true;
                        break;
                    }
                }
                if (!is) {
                    var candidateEntry = {votes: [], user: {id: vote.prid}};
                    candidateEntry.votes.push(vote.voterid);
                    ch.electionData.candidates.push(candidateEntry);
                    main.getuser(vote.prid, function(user) {
                        if (user) {
                            for (var f in ch.electionData.candidates) {
                                var can = ch.electionData.candidates[f];
                                if (can.user.id == user.id) {
                                    can.user = user;
                                }
                            }

                        }
                    });

                }
            }
            ch.sortElection();
        }
    });

}

Channel.prototype.stopElection = function() {
    var ch = this;
    ch.election = false;
    if (ch.electionData.candidates[0].user) {
        ch.setop({id: ch.electionData.candidates[0].user.id, pr: true});
        for (var e in ch.editors) {
            var data = {
                chid: ch.id,
                id: ch.editors[e].id
            }
            db.removeop(data);
        }
        for (var b in ch.banned) {
            var data = {
                chid: ch.id,
                id: ch.banned[b].id
            }
            db.unbanuser(data);
        }
        ch.banned = [];
        ch.editors = [];

    }
}

Channel.prototype.addPRVote = function(data, callback) {
    var ch = this;
    var is = false;
    var already = false;
    data.prid = parseInt(data.prid);
    for (var j in ch.electionData.candidates) {
        var candidate = ch.electionData.candidates[j];
        if (candidate) {
            var f = candidate.votes.length;
            while (f--) {
                if (candidate.votes[f]) {
                    if (candidate.votes[f] == data.voterid) {
                        if (candidate.user.id == data.prid) {
                            already = true;
                            if (callback) {
                                callback({error: 'already'});
                            }
                            break;
                        } else {
                            candidate.votes.splice(f, 1);
                        }
                    }
                }
            }


            if (candidate.user.id == data.prid && !already) {
                candidate.votes.push(data.voterid);
                ch.sortElection();
                db.addPRVote({channel: ch.id, voterid: data.voterid, prid: data.prid}, function(data) {
                    if (callback) {
                        callback(packElectionData(ch.electionData, data.voterid));
                    }
                });

                is = true;
                break;
            }
        }


    }
    if (!is && !already) {
        console.log('не нашли нашли юзера, ищем в базе ' + data.prid + ' - already ' + already + ' is ' + is);
        main.getuser(data.prid, function(findeduser) {
            if (findeduser) {
                var candidateEntry = {votes: [], user: findeduser};
                candidateEntry.votes.push(data.voterid);
                ch.electionData.candidates.push(candidateEntry);
                ch.sortElection();
                db.addPRVote({channel: ch.id, voterid: data.voterid, prid: data.prid}, function(data) {
                    console.log(data)
                });
                if (callback) {
                    callback(packElectionData(ch.electionData, data.voterid));
                }
            } else {
                if (callback) {
                    callback({error: 'no user'});
                }
            }
        });
    }
}


Channel.prototype.killTrack = function(trackid, self) {
    var ch = this;
    if (trackid == ch.current.id) {
        ch.skip();
    }
    for (var t in this.playlist) {
        if (ch.playlist[t].id == trackid) {
            var tr = ch.playlist[t];
            db.removeTrack(trackid, function() {
                if (main.user(tr.submiter)) {
                    main.user(tr.submiter).updateLimits();
                }
            });
            killfile(ch.playlist[t].path);
            ch.playlist.splice(t, 1);
            ch.sort();
            sockets.sendRemoveTrack({'chid': ch.id, 'tid': trackid});
            break;
        }
    }

}

Channel.prototype.sort = function() {
    if (this.playlist.length > 0) {
        var nxt = this.playlist[0].id;
        this.playlist.sort(sortFunction);
        var now = new Date(Date.now() + 10800000);
        var ot = this.overalTime;
        this.overalTime = 0;
        for (var i in this.playlist) {
            var track = this.playlist[i];
            this.overalTime += track.time;
            if (Date.parse(now) - Date.parse(track.date) > 43200000 && ot > 43200) {
                this.killTrack(track.id);
            }
        }
        if (this.playlist[0].id != nxt || this.playlist.length == 1) {
            this.setNext();
        }
    }

}

Channel.prototype.play = function() {
    exec('mpc -p ' + this.port + ' play', function(error, stdout, stderr) {
    });
}

Channel.prototype.skip = function() {
    exec('mpc -p ' + this.port + ' next', function(error, stdout, stderr) {
        if (!error) {
        }
    });
}

Channel.prototype.getElectionData = function(userid) {
    return packElectionData(this.electionData, userid);
}

Channel.prototype.setNext = function() {
    var ch = this;
    ch.processing = true;
    if (this.playlist.length > 0) {
        var p = ch.playlist[0].path;
        var track = ch.playlist[0];
        exec('mpc -p ' + ch.port + ' crop', function(error, stdout, stderr) {
            if (!error) {
                exec('mpc -p ' + ch.port + ' update --wait', function(error, stdout, stderr) {
                    if (!error) {
                        exec('mpc -p ' + ch.port + ' add "' + p + '"', function(error, stdout, stderr) {
                            ch.processing = false;
                            if (!error) {

                            } else {
                                sockets.sendRemoveTrack({'chid': ch.id, 'tid': track.id});
                                ch.playlist.splice(0, 1);
                                ch.sort();
                                ch.setNext();

                            }
                        });
                    } else {
                        ch.processing = false;
                    }
                });
            } else {
                ch.processing = false;
            }
        });
    } else {
        exec('mpc -p ' + ch.port + ' crop', function(error, stdout, stderr) {
            ch.processing = false;
            if (!error) {
            } else {
            }
        });

    }
}


exports.newChannel = function(info) {
    var c = new Channel(info);
    return c;
};


function killfile(path) {
    var p = '/home/trigger/upload/' + path;
    exec('rm "' + p + '"', function(error, stdout, stderr) {
        if (!error) {
        } else {
        }
    });

}

function sortFunction(a, b) {
    if (a.rating < b.rating) {
        return 1;
    }
    if (a.rating > b.rating) {
        return -1;
    }
    if (a.rating == b.rating) {
        return parseInt(a.id) - parseInt(b.id);
    }
    return 0

}

function packElectionData(electionData, userid) {
    var data = {candidates: []};
    for (var i in electionData.candidates) {
        var can = {
            name: electionData.candidates[i].user.name,
            id: electionData.candidates[i].user.id,
            votes: electionData.candidates[i].votes.length
        }
        data.candidates.push(can);
        if (userid) {
            for (var g in electionData.candidates[i].votes) {
                if (electionData.candidates[i].votes[g] == userid) {
                    data.your = can;
                }
            }

        }
    }
    return data;
}


function packTrackData(track) {
    if (track) {
        var td = {
            a: track.artist,
            t: track.title,
            s: track.name,
            id: track.id,
            sid: track.submiter,
            tt: track.time,
            ut: track.date,
            i: track.info,
            tg: track.tags,
            p: [],
            n: [],
            r: track.rating
        }

        var positive = track.positive;
        var negative = track.negative;

        for (var i in positive) {
            td.p.push({
                v: positive[i].value,
                vid: positive[i].voterid,
                n: positive[i].name
            });
        }
        for (var i in negative) {
            td.n.push({
                v: negative[i].value,
                vid: negative[i].voterid,
                n: negative[i].name
            });
        }
        return td;
    } else {
        return null;
    }

}
