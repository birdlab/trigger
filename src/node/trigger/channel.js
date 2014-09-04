var utils = require('./utils.js');
var tester = require('./tester.js');
var chat = require('./chat.js');
var log = require('./log.js');
var db = require('./dbdata.js');
var exec = require("child_process").exec;
var main = require('../trigger.js');
var sockets = require('./sockets.js');

function Channel(i) {
    this.id = i.id;
    this.port = i.port;
    this.name = i.name;
    this.prid = i.prid;
    this.prname = i.prname;
    this.editors = i.editors;
    this.banned = i.banned;
    this.description = i.description;
    this.hilink = i.hilink;
    this.lowlink = i.lowlink;
    this.playlist = [];
    this.current = false;
    this.next = false;
    this.chat = chat.newChat(this.id);
    this.currentTime = 0;
    this.processing = false;
    this.query = [];
    this.listeners = 0
    this.init();
    this.playing = true;
    this.chip = [];
    this.active = 0;
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
}

Channel.prototype.setop = function(data, callback) {

    var ch = this;
    if (data.pr) {
        main.getuser(data.id, function(user) {
            if (user) {
                ch.prid = data.id;
                ch.prname = user.name;
                db.setpr(data);
                callback({id: data.id, name: user.name, chid: ch.id});
            }
        });
    } else {
        if (!data.post) {
            data.post = 'редактор';
        }
        var e = false;
        for (var c in main.channels) {
            var channel = main.channels[c];
            for (var o in channel.editors) {
                if (channel.editors[o].id == data.id) {
                    if (main.channels[c].id != data.chid) {
                        if (!e) {
                            e = 'another';
                            callback({error: e});
                        }
                    } else {
                        if (e) {
                            e = 'changed';
                            channel.editors[o].post = data.post;
                            db.replaceop(data);
                            callback({editors: ch.editors});
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
                                ch.editors.push(editor);
                                callback({editors: ch.editors});
                            }
                        });

                    }
                });
            } else {
                e = 'overload';
                callback({error: e});
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
            callback({editors: ch.editors});
            break;
        }
    }

}

Channel.prototype.setprops = function(channeldata, callback) {
    var ch = this;
    var data = {chid: ch.id};
    if (channeldata.rate) {
        data.rate = channeldata.rate;
    }
    if (channeldata.limit) {
        data.limit = channeldata.limit;
    }
    // if (channeldata.limit){
    //     data.anonce=channeldata.anonce;
    // }
    if (channeldata.description) {
        data.description = channeldata.description;
        ch.description = channeldata.description;
    }
    console.log('all data to base ', data);
    db.savechannelstate(data, callback);
}

Channel.prototype.banuser = function(data, callback) {
    var ch = this;
    if (!ch.isbanned(data.id)) {
        main.getuser(data.id, function(user) {
            if (user) {
                console.log(user);
                var newbanned = {
                    id: data.id,
                    name: user.name,
                    reason: data.r
                }
                ch.banned.push(newbanned);
                db.banuser(data);
                callback({banned: ch.banned});
            }
        });
    } else {
        callback({error: 'in'});
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
    if (ch.currentTime > ch.current.time && !ch.playlist.length > 0) {
        ch.currentTime = 0;
        sockets.sendNewCurrent({'chid': ch.id, 'track': packTrackData(ch.current)});
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
        tester.test(track.path, function(ans) {
            if (ans) {
                track.time = ans;
                if (track.id) {
                    ch.playlist.push(track);
                    ch.sort();
                    if (!ch.current && ch.playlist.length > 0) {
                        ch.pushNext();
                    }
                    sockets.sendAddTrack({'chid': ch.id, 'track': packTrackData(track)});
                } else {
                    var user = main.user(track.submiter);
                    if (user) {
                        if (user.time > track.time || ch.chat.users.length<11 || ch.id != 1 || ch.playlist.length < 11 ) {
                            ch.playlist.push(track);
                            track.channel = ch.id;
                            track.unlim = 0;
                            if ((ch.chat.users.length<11 || ch.playlist.length < 10) && ch.id == 1) {
                                track.unlim = 1;
                            }
                            db.addTrack(track, function() {
                                track.rating = 0;
                                track.positive = [];
                                track.negative = [];
                                if (!track.novote) {
                                    var weight = user.fastinfo().w;
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
                                }
                            });
                        } else {
                            if (callback) {
                                callback({'error': 'Огорчение! Трек оказался длиннее лимита ('});
                            }
                            killfile(track.path);
                        }
                    }
                }

            } else {
                if (callback) {
                    callback({'error': 'Трек не удалось протестировать. Возможно русские буквы в начале названия файла.'});
                }
                killfile(track.path);
            }
        });
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
    if (track) {
        if (Math.abs(data.v) <= data.user.weight) {
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
    if (callback) {
        callback();
    }
}

Channel.prototype.processTrack = function(track) {
    var ch = this;
    db.setPlayDate(track.id, ch.currentTime);
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
    killfile(track.path);
}

Channel.prototype.killTrack = function(trackid, self) {
    var ch = this;
    if (trackid == ch.current.id) {
        ch.skip();
    }
    for (var t in this.playlist) {
        if (ch.playlist[t].id == trackid) {
            if (self) {
                var tr = ch.playlist[t];
                db.removeTrack(trackid, function() {
                    main.user(tr.submiter).updateLimits();
                });
            }
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


function packTrackData(track) {
    if (track) {
        var td = {
            a: track.artist,
            t: track.title,
            s: track.name,
            id: track.id,
            sid: track.submiter,
            tt: track.time,
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
