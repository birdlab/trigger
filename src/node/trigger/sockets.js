var main = require('../trigger.js');
var db = require('./dbdata.js');
var http = require('http');

var parser = require('./dataparser.js');

//var io = require('socket.io').listen(40033, { log: true });
var io = require('socket.io')(40033);



var version = 2200;
var sockets = [];
io.sockets.on('connection', function(socket) {
    socket.on('ver', function(data) {
        if (data.v == version) {
            var du = {
                channels: []
            };
            if (data.init) {
                for (var c in main.channels) {
                    var ch = main.channels[c];
                    du.channels.push({
                        'name': ch.name,
                        'id': ch.id,
                        'hi': ch.hilink,
                        'low': ch.lowlink,
                        'users': ch.chat.compactUsers(),
                        'current': ch.getCurrent()
                    });
                }
            } else {
                du = true;
            }

            socket.emit('welcome', du);
            bind(socket);
        } else {
            socket.emit('welcome', false);
        }
    });
    socket.emit('getver');
});

function bind(socket) {
    sockets.push(socket);
    var address = socket.handshake.address;
    socket.ip = socket.handshake.headers['x-real-ip'];
    if (socket.handshake.address) {
        socket.port = socket.handshake.address['port'];
    } else {
        socket.port = '0000'
    }
    socket.active = false;
    socket.on('login', function(data) {
        var is = false;
        for (var u in main.users) {
            if (main.users[u].name == data.u && main.users[u].pass == data.p) {
                is = true;
                var user = main.users[u];
                socket.user = user;
                socket.emit('loginstatus', {'user': user.fastinfo(), 'virtual': socket.user.virtual});
                user.addSocket(socket.id);
                break;
            }
        }
        if (!is) {
            data.ip = socket.ip + '.' + socket.port;
            db.login(data, function(data) {
                if (data.error) {
                    socket.emit('loginstatus', {'error': data.error});
                } else {
                    var user = data.user;
                    for (var u in main.users) {
                        if (main.users[u].id == data.user.id) {
                            is = true;
                            var user = main.users[u];
                            socket.user = user;
                            socket.emit('loginstatus', {'user': user.fastinfo(), 'virtual': socket.user.virtual});
                            user.addSocket(socket.id);
                            break;
                        }
                    }
                    if (!is) {
                        socket.user = data.user;
                        main.users.push(user);
                        user.addSocket(socket.id);
                        for (var s in sockets) {
                            var ss = sockets[s];
                            if (ss.id != socket.id && ss.user && ss.user.id != user.id && ss.ip == socket.ip && ss.port == socket.port) {
                                socket.user.virtual = true;
                                break;
                            }
                        }
                        user.updateLimits(function() {
                            socket.emit('loginstatus', {'user': user.fastinfo(), 'virtual': socket.user.thevirtua});
                        });
                    }
                }
            });
        }
    });

    socket.on('disconnect', function() {
        if (socket.user) {
            socket.user.delSocket(socket.id);
            for (var c in main.channels) {
                var ch = main.channels[c];
                if (ch.id == socket.channel) {
                    ch.chat.removeUser(socket);
                }
            }

        }
        for (var i in sockets) {
            if (socket.id == sockets[i].id) {
                sockets.splice(i, 1);
                break;
            }
        }
    });
    socket.on('logout', function() {
        if (socket.user) {
            socket.user.delSocket(socket.id);
            for (var c in main.channels) {
                var ch = main.channels[c];
                if (ch.id == socket.channel) {
                    ch.chat.removeUser(socket);
                }
            }

        }
        socket.user = false;
        socket.disconnect();
    });
    socket.on('gochannel', function(data) {
        if (main.channel(data.id)) {
            if (socket.user) {
                if (main.channel(socket.channel)) {
                    var oldchannel = main.channel(socket.channel);
                    oldchannel.chat.removeUser(socket);
                }
            }

            var ch = main.channel(parseInt(data.id));
            if (socket.user && !ch.isbanned(socket.user.id)) {
                ch.chat.addUser(socket);
            }
            socket.channel = data.id;
            var userdata = ch.getPlaylist();
            userdata.hi = ch.hilink;
            userdata.low = ch.lowlink;
            userdata.lst = ch.listeners;
            userdata.a = ch.active;
            userdata.name = ch.name;
            socket.emit('channeldata', userdata);
        }
    });
    socket.on('getplaylist', function(data) {
        for (var c in main.channels) {
            if (main.channels[c].id == data.id) {
                socket.emit('playlist', main.channels[c].getPlaylist());
                break;
            }
        }
    });

    socket.on('getchat', function(data) {
        if (socket.user) {
            if (!data.shift) {
                data.shift = 0;
            }
            var ch = main.channel(data.id);
            if (ch) {
                if (!ch.isbanned(socket.user.id)) {
                    ch.chat.getMessages(data.shift, function(chatdata) {
                        socket.emit('chatdata', chatdata);
                    });
                }
            }
            ;
        }
    });

    socket.on('sendmessage', function(data, callback) {
        if (socket.user) {
            if (socket.channel) {
                var ch = main.channel(socket.channel);
                if (socket.user.rating > -10 && !ch.isbanned(socket.user.id)) {
                    data.uid = socket.user.id;
                    data.uname = socket.user.name;
                    data.chid = socket.channel;
                    data.tid = ch.current.id;
                    ch.chat.addMessage(data, socket.user, callback);
                }
            }
        }
    });

    socket.on('getchannels', function(data) {
        var dataforuser = {channels: []};
        for (var c in main.channels) {
            var ch = main.channels[c];
            var channeldata = {
                'name': ch.name,
                'id': ch.id,
                'description': ch.description,
                'current': ch.getCurrent(),
                'users': ch.chat.compactUsers(),
                'lst': ch.listeners,
                'hi': ch.hilink,
                'low': ch.lowlink
            };
            if (socket.user) {
                channeldata.editors = ch.editors;
                channeldata.prid = ch.prid;
                channeldata.prname = ch.prname;
                channeldata.banned = ch.banned;
            }
            dataforuser.channels.push(channeldata);
        }
        socket.emit('channelsdata', dataforuser);
    });

    socket.on('gethistory', function(data) {
        if (data.s == 0) {
            data.s = new Date();
        }
        db.getTracksByShift(data.chid, data.s, data.g, function(data) {
            socket.emit('history', data);
        });
    });

    socket.on('tracksubmit', function(data, callback) {
        if (socket.user && !socket.user.virtual) {
            data.track.submiter = socket.user.id;
            data.track.name = socket.user.name;
            main.channel(data.chid).addTrack(data.track, callback);
        }
    });


    socket.on('gettags', function(data) {
        if (data.s) {
            db.getTags(data.s, function(data) {
                if (!data.error) {
                    socket.emit('tags', data);
                }
            });
        }
    });

    socket.on('addtag', function(data) {
        if (socket.user) {
            if (data.s) {
                db.addTag(data.s, function(dbdata) {
                    if (!dbdata.error) {
                        dbdata.n = data.s;
                        var userdata = {t: [dbdata]}
                        socket.emit('tags', userdata);
                    }
                });
            }
        }
    });


    socket.on('vote', function(data) {
        if (socket.user) {
            if (!socket.user.virtual) {
                data.user = socket.user;
                if (data.chid) {
                    var ch = main.channel(data.chid)
                    if (ch) {
                        if (!ch.isbanned(socket.user.id)) {
                            ch.addVote(data, function(data) {
                            });
                        }
                    }
                }


            }
        }
    });
    socket.on('uvote', function(data) {
        if (socket.user) {
            if (!socket.user.rating > -1) {
                data.user = socket.user;
                var user = main.user(data.id);
                var addv = function() {
                    if (data.v != 0) {
                        var newvote = {
                            'value': data.v,
                            'voterid': data.user.id,
                            'name': data.user.name
                        }
                        if (data.v > 0) {
                            user.positive.push(newvote);
                        } else {
                            user.negative.push(newvote);
                        }

                    }
                    var rating = 0;
                    for (var i in user.positive) {
                        rating += user.positive[i].value;
                    }
                    for (var i in user.negative) {
                        rating += user.negative[i].value;
                    }
                    user.rating = rating;
                    if (user.rating < -9) {
                        for (var id in user.sockets) {
                            getID(user.sockets[id]).disconnect();
                        }
                    }
                }
                var processvote = function() {
                    if (Math.abs(data.v) <= 1 && data.user.id != user.id) {
                        var vdata = findvote(user, data.user.id);
                        if (vdata) {
                            if (vdata.value != data.v) {
                                vdata.group.splice(vdata.index, 1);
                                addv();
                            }
                        } else {
                            addv();
                        }
                        db.addUserVote(data);
                        user.updateLimits();
                        user.fullinfo(user.id == socket.user.id, function(sdata) {
                            if (sdata) {
                                socket.emit('uvd', {id: sdata.id, r: sdata.r, p: sdata.p, n: sdata.n});
                            }
                        });

                    }
                }
                var findvote = function(user, userid) {
                    for (var i in user.positive) {
                        if (user.positive[i].voterid == userid) {
                            return {'group': user.positive, 'index': i, 'vote': user.positive[i]};
                        }
                    }
                    for (var i in user.negative) {
                        if (user.negative[i].voterid == userid) {
                            return {'group': user.negative, 'index': i, 'vote': user.negative[i]};
                        }
                    }
                    return false;
                }
                if (!user) {
                    db.getuser(data.id, function(dbdata) {
                        if (dbdata.user) {
                            user = dbdata.user;
                            processvote();
                        }
                    });
                } else {
                    processvote();
                }
            }
        }
    });


    socket.on('deltrack', function(data) {
        if (socket.user) {
            var track = main.channel(data.chid).track(data.tid);
            if (track) {
                if (track.submiter == socket.user.id || data.chid == socket.user.prch || data.chid == socket.user.opch) {
                    main.channel(data.chid).killTrack(data.tid, track.submiter == socket.user.id);
                }
            }
        }
    });
    socket.on('banuser', function(data, callback) {
        if (socket.user) {
            if (socket.user.id == 1) {
                socket.user.prch = socket.channel;
            }
            data.chid = socket.user.prch || socket.user.opch
            if (data.chid) {
                var channel = main.channel(data.chid);
                channel.banuser(data, function(bandata) {
                    if (!data.error) {
                        for (var s in sockets) {
                            var so = sockets[s];
                            if (so.user) {
                                if (so.user.id == data.id && data.chid == so.channel) {
                                    main.channel(data.chid).chat.removeUser(so);
                                    so.emit('banned', data);
                                }
                            }
                        }
                    }
                    callback(bandata);
                });

            }
        }
    });
    socket.on('unbanuser', function(data, callback) {
        if (socket.user) {
            if (!socket.user.id == 1) {
                data.chid = socket.user.prch || socket.user.opch;
            } else {
                if (!data.chid) {
                    data.chid = socket.user.prch || socket.user.opch
                }
            }
            if (data.chid) {
                main.channel(data.chid).unbanuser(data, callback);
            }
        }
    });
    socket.on('setop', function(data, callback) {
        if (socket.user) {
            if (socket.user.id != 1) {
                data.pr = false;
                data.chid = socket.user.prch;
            }
            var oldpr = main.channel(data.chid).prid;
            if (data.chid) {
                main.channel(data.chid).setop(data, function(d) {
                    if (!d.error) {
                        for (var s in sockets) {
                            var so = sockets[s];
                            if (so.user) {
                                if (data.pr && so.user.id == oldpr) {
                                    so.user.prch = false;
                                    so.emit('loginstatus', {'user': so.user.fastinfo(), 'virtual': so.user.virtual});
                                }
                                if (so.user.id == data.id) {
                                    if (data.pr) {
                                        so.user.prch = data.chid;
                                    } else {
                                        so.user.opch = data.chid;
                                    }
                                    so.emit('loginstatus', {'user': so.user.fastinfo(), 'virtual': so.user.virtual});
                                }

                            }
                        }
                    }
                    if (callback) {
                        callback(d);
                    }
                });
            }
        }
    });

    socket.on('setprops', function(data, callback) {
        if (socket.user) {
            if (socket.user.id != 1) {
                data.chid = socket.user.prch;
            } else {
                data.chid = socket.channel;
            }
            console.log(data);
            if (data.chid) {
                main.channel(data.chid).setprops(data, function(d) {
                    if (callback) {
                        callback(d);
                    }
                });
            }
        }
    });

    socket.on('removeop', function(data, callback) {
        if (socket.user) {
            if (socket.user.id != 1) {
                data.chid = socket.user.prch;
            }
            if (data.chid) {
                main.channel(data.chid).removeop(data, function(d) {
                    for (var s in sockets) {
                        var so = sockets[s];
                        if (so.user) {
                            if (so.user.id == data.id) {
                                so.user.opch = false;
                                so.emit('loginstatus', {'user': so.user.fastinfo(), 'virtual': so.user.virtual});
                            }
                        }
                    }
                    if (callback) {
                        callback(d);
                    }
                });
            }
        }
    });


    socket.on('getuser', function(data, callback) {
        if (data) {
            if (socket.user) {
                if (data.id) {
                    if (data.uplshift !== undefined) {
                        if (data.uplshift == 0) {
                            data.uplshift = new Date();
                        }
                        if (data.p == undefined) {
                            db.getuploads(data.id, data.uplshift, function(dbdata) {
                                if (callback) {
                                    callback(dbdata);
                                }
                            });
                        } else {
                            db.getVoted(data.id, data.uplshift, data.p, function(dbdata) {
                                if (callback) {
                                    callback(dbdata);
                                }
                            });
                        }
                    } else {
                        if (main.user(data.id)) {
                            var user = main.user(data.id);
                            user.fullinfo(user.id == socket.user.id, function(data) {
                                callback(data);
                            });
                        } else {
                            db.getuser(data.id, function(dbdata) {
                                if (dbdata.user) {
                                    dbdata.user.fullinfo(data.id == socket.user.id, function(data) {
                                        callback(data);
                                    });
                                }
                            });
                        }
                    }
                }
            } else {
                if (callback) {
                    callback(false);
                }
            }
        }
    });

    socket.on('sendinvite', function(data) {
        if (data) {
            if (socket.user) {
                db.sendinvite(data.c, data.m, socket);
            }
        }
    });

    socket.on('getfastrack', function(data, callback) {
        if (data) {
            if (data.id) {
                callback(parser.getTrack[data.id]);
            }
        }
    });
    socket.on('getfastuser', function(data, callback) {
        if (data) {
            if (data.id) {
                callback(parser.getUser[data.id]);
            }
        }
    });

    socket.on('recover', function(data) {
        var s = socket;
        db.recoverpass(data.m, function(data) {
            s.emit('recoverstatus', data);
        });
    });
    socket.on('changepass', function(data) {
        var s = socket;
        if (s.user) {
            if (s.user.pass == data.o) {
                db.changeuserpass(s.user.id, data.n, function(status) {
                    if (status.ok) {
                        s.user.pass = data.n;
                    }
                    s.emit('changepass', status);
                });
            } else {
                s.emit('changepass', {ok: false, e: 'wrong'});
            }
        }

    });
    socket.on('upduserdata', function(data) {
        var s = socket;
        if (s.user) {
            s.user.gender = data.g;
            db.changeuserdata(s.user);
        }
    });

}
function getID(id) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.id == id) {
            return socket;
        }
    }
    return false;

}
exports.getid = function(id) {
    return getID(id);
};

exports.sendAddTrack = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == data.chid) {
            socket.emit('addtrack', data);
        }
    }

};
exports.sendMessage = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (data.pm) {
            if (socket.user) {
                if (socket.user.name == data.pm || socket.user.name == data.uname) {
                    socket.emit('message', data);
                }
            }
        } else {
            if (socket.channel == data.chid) {
                socket.emit('message', data);
            }
        }
    }

};
exports.sendNewUser = function(id, user) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == id) {
            socket.emit('newuser', {
                chid: id,
                n: user.name,
                uid: user.id
            });
        }
    }
};
exports.sendOffUser = function(id, user) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == id) {
            socket.emit('offuser', {
                chid: id,
                n: user.name,
                uid: user.id
            });
        }
    }
};
exports.sendNewCurrent = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        socket.emit('newcurrent', data);
    }

};

exports.sendUpdateTrack = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == data.chid) {
            socket.emit('uptr', data);
        }
    }

};
exports.sendUserStatus = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == data.chid) {
            socket.emit('usupd', data);
        }
    }
}
exports.sendRemoveTrack = function(data) {
    for (var s in sockets) {
        var socket = sockets[s];
        if (socket.channel == data.chid) {
            socket.emit('removetrack', data);
        }
    }
};
exports.sendListners = function(data) {
    for (var s in sockets) {
        sockets[s].emit('lst', data);
    }
};
exports.updateLimits = function(user) {
    for (var s in user.sockets) {
        var socket = getID(user.sockets[s]);
        if (socket) {
            var data = {
                't': user.time, 'nt': user.nextUpdate, 'w': user.weight
            }
            socket.emit('uplim', data);
        }
    }
};

