function sortFunction(a, b) {
    if (a.r < b.r) {
        return 1;
    }
    if (a.r > b.r) {
        return -1;
    }
    if (a.r == b.r) {
        return parseInt(a.id) - parseInt(b.id);
    }
    return 0

}


function findUrl(image, size) {
    var n, entry;
    for (n = 0; n < image.length; ++n) {
        entry = image[n];
        if (entry.size == size) {
            var p = entry["#text"];
            if (p.length > 0) {
                return entry["#text"];
            }
        }
    }
    return 'img/nocover.png';
}

function getcover(a, t, callback) {
    var src = 'img/nocover.png';
    if (lastfm) {
        lastfm.track.getInfo({artist: a, track: t, autocorrect: 1}, {
            success: function(data) {
                try {
                    src = findUrl(data.track.album.image, 'medium');
                    callback(src);
                } catch (err) {
                    lastfm.artist.getInfo({artist: a, autocorrect: 1}, {
                        success: function(data) {
                            src = findUrl(data.artist.image, 'medium');
                            callback(src);
                        },
                        error: function(code, message) {
                            callback(src);
                        }
                    });
                }
            },
            error: function(code, message) {
                callback(src);
            }
        });
    }

}


function Client(host) {
    this.version = 2205;
    this.user = null;
    this.channel = {}
    this.callbacks = {};
    this.chat = null;
    this.trackscache = [];
}

var lastfm = null;

Client.prototype.init = function(host) {
    console.log('init');
    // this.socket = io.connect(host, {resource: 'socket.io'});
    this.socket = io();
    var socket = this.socket;
    var cl = this;
    lastfm = new LastFM({
        apiKey: '4366bdedfe39171be1b5581b52ddee90',
        apiSecret: '5def31e9198fa02af04873239bcb38f5'
    });

    socket.on('welcome', function(data) {
        $(cl).trigger('welcome', data);
    });

    socket.on('getver', function() {
        socket.emit('ver', {'v': cl.version, 'init': true});
    });

    socket.on('addtrack', function(data) {
        data.track.src = 'img/nocover.png';
        var track = data.track
        track.vote = 0;
        if (cl.user) {
            for (var v in track.n) {
                if (track.n[v].vid == cl.user.id) {
                    track.vote = track.n[v].v;
                    break;
                }
            }
            for (var v in track.p) {
                if (track.p[v].vid == cl.user.id) {
                    track.vote = track.p[v].v;
                    break;
                }
            }
        }

        cl.channel.pls.push(track);
        cl.channel.pls.sort(sortFunction);
        $(cl).trigger('addtrack', data);
        getcover(track.a, track.t, function(src) {
            track.src = src;
            $(cl).trigger('cover', {id: data.track.id, 'src': src});
        });

    });
    socket.on('removetrack', function(data) {
        for (var t in cl.channel.pls) {
            if (cl.channel.pls[t].id == data.tid) {
                data.track = cl.channel.pls[t];
                $(cl).trigger('removetrack', data);
                cl.channel.pls.splice(t, 1);
                break;
            }
        }
    });

    socket.on('newcurrent', function(data) {
        if (data.chid == cl.channel.chid) {
            for (var tr in cl.channel.pls) {
                if (cl.channel.pls[tr].id == data.track.id) {
                    data.track.src = cl.channel.pls[tr].src;
                    data.track.vote = cl.channel.pls[tr].vote;
                    cl.channel.pls.splice(tr, 1);
                    break;
                }
            }
            cl.channel.current = data.track;
            cl.channel.ct = 0;
        }

        $(cl).trigger('newcurrent', data);
        $(cl).trigger('removetrack', data);
    });
    socket.on('lst', function(data) {
        for (var i in cl.channels) {
            if (data.chid == cl.channels[i].id) {
                cl.channels[i].lst = data.l;
            }
        }
        if (data.chid == cl.channel.chid) {
            cl.channel.lst = data.l;
            cl.channel.a = data.a;
        }
        $(cl).trigger('listners', data);
    });
    socket.on('usupd', function(data) {
        if (cl.chat) {
            for (var us in cl.chat.u) {
                if (cl.chat.u[us].id == data.uid) {
                    cl.chat.u[us].a = data.a;
                }
            }
            $(cl).trigger('userupdate', data);
        }
    });
    socket.on('uplim', function(data) {
            if (cl.user) {
                if (data.nt > 0) {
                    cl.user.nt = new Date(Date.parse(new Date()) + data.nt);
                } else {
                    cl.user.nt = 0;
                }
                cl.user.t = data.t;
                if (cl.user.t < 0) {
                    cl.user.t = 0;
                }
                cl.user.w = data.w;

                $(cl).trigger('updatelimits', data);
            }
        }
    )
    ;
    socket.on('channeldata', function(data) {
        var i = 0;
        var gg = function() {
            var tr = cl.channel.pls[i];
            getcover(tr.a, tr.t, function(src) {
                tr.src = src;
                $(cl).trigger('cover', {id: tr.id, 'src': src});
                i += 1;
                if (i < cl.channel.pls.length) {
                    gg();
                }
            });
        }
        data.changed = true;
        data.hi = streampath + data.hi;
        data.low = streampath + data.low;
        cl.channel = data;

        var track = cl.channel.current;
        if (track) {
            track.vote = 0;
            if (cl.user) {
                for (var v in track.n) {
                    if (track.n[v].vid == cl.user.id) {
                        track.vote = track.n[v].v;
                        break;
                    }
                }
                for (var v in track.p) {
                    if (track.p[v].vid == cl.user.id) {
                        track.vote = track.p[v].v;
                        break;
                    }
                }
            }
        }

        for (var t in cl.channel.pls) {
            var track = cl.channel.pls[t];
            if (track) {
                track.vote = 0;
                if (cl.user) {
                    for (var v in track.n) {
                        if (track.n[v].vid == cl.user.id) {
                            track.vote = track.n[v].v;
                            break;
                        }
                    }
                    for (var v in track.p) {
                        if (track.p[v].vid == cl.user.id) {
                            track.vote = track.p[v].v;
                            break;
                        }
                    }
                }
            }
        }
        getcover(data.current.a, data.current.t, function(src) {
            data.current.src = src;
            $(cl).trigger('cover', {id: data.current.id, 'src': src});
        });

        cl.callbacks.channeldata(cl.channel);
        if (cl.channel.pls.length > 0) {
            gg();
        }
    });

    socket.on('message', function(data) {
        cl.chat.m.push(data);
        $(cl).trigger('message', data);
    });

    socket.on('history', function(data) {
        cl.callbacks.history(data);
    });

    socket.on('channelsdata', function(data) {
        cl.channels = data.channels;
        cl.callbacks.channelsdata(data);
    });
    socket.on('userdata', function(data) {
        console.log(data);
        cl.callbacks.userdata(data);
    });
    socket.on('uvd', function(data) {
        cl.callbacks.uvotedata(data);
    });
    socket.on('invitestatus', function(data) {
        cl.callbacks.invitestatus(data);
    });
    socket.on('recoverstatus', function(data) {
        cl.callbacks.recover(data);
    });
    socket.on('changepass', function(data) {
        cl.callbacks.changepass(data);
    });

    socket.on('banned', function(data) {
        $(cl).trigger('banned', data);
    });

    socket.on('newuser', function(data) {
        if (cl.chat) {
            var user = {
                id: data.uid,
                n: data.n,
                a: data.a
            }
            cl.chat.u.push(user);
            $(cl).trigger('newuser', data);
        }
    });
    socket.on('offuser', function(data) {
        if (cl.chat) {
            for (var us in cl.chat.u) {
                if (cl.chat.u[us].id == data.uid) {
                    cl.chat.u.splice(us, 1);
                }
            }
            $(cl).trigger('offuser', data);
        }
    });

    socket.on('playlist', function(data) {
        cl.callbacks.playlist(data);
    });

    socket.on('loginstatus', function(data) {
        if (data.error) {
            var message = '';
            if (data.error == 'nouser') {
                data.error = 'Нет такого пользователя';
            }
            if (data.error == 'wrongpass') {
                data.error = 'Не тот пароль';
            }
        } else {
            cl.user = data.user;
            if (cl.user.t < 0) {
                cl.user.t = 0;
            }
            cl.user.nt = new Date(Date.parse(new Date()) + cl.user.nt);

        }
        cl.callbacks.loginstatus(data);
    });

    socket.on('disconnect', function(data) {
        $(cl).trigger('disconnect');
        cl.user = null;
        cl.channel = {}
        cl.callbacks = {};
        cl.chat = null;
    });
    socket.on('tags', function(data) {
        cl.callbacks.tags(data.t);
    });

    socket.on('uptr', function(data) {
        if (data.t.id == cl.channel.current.id) {
            var src = cl.channel.current.src;
            cl.channel.current = data.t;
            cl.channel.current.scr = src;
            var track = cl.channel.current;
            track.vote = 0;
            for (var v in track.n) {
                if (track.n[v].vid == cl.user.id) {
                    track.vote = track.n[v].v;
                    break;
                }
            }
            for (var v in track.p) {
                if (track.p[v].vid == cl.user.id) {
                    track.vote = track.p[v].v;
                    break;
                }
            }

            data.current = true;
        } else {
            for (var t in cl.channel.pls) {
                if (cl.channel.pls[t].id == data.t.id) {
                    cl.channel.pls[t] = data.t;
                    var track = cl.channel.pls[t];
                    track.vote = 0;
                    if (cl.user) {
                        for (var v in track.n) {
                            if (track.n[v].vid == cl.user.id) {
                                track.vote = track.n[v].v;
                                break;
                            }
                        }
                        for (var v in track.p) {
                            if (track.p[v].vid == cl.user.id) {
                                track.vote = track.p[v].v;
                                break;
                            }
                        }
                    }
                    cl.channel.pls.sort(sortFunction);
                    data.current = false;
                    break;
                }
            }
        }
        $(cl).trigger('trackupdate', data);
    });
}

Client.prototype.login = function(name, pass, callback) {
    var cl = this;
    cl.callbacks.loginstatus = callback;
    this.socket.emit('login', {u: name, p: pass});
}
Client.prototype.track = function(id, callback) {
    var cl = this;
    var complete = false;
    if (id == cl.channel.current.id) {
        if (callback) {
            callback(cl.channel.current);
            complete = true;
        } else {
            return cl.channel.current
        }
    }
    for (var t in cl.channel.pls) {
        if (cl.channel.pls[t].id == id) {
            if (callback) {
                callback(cl.channel.pls[t]);
                complete = true;
            } else {
                return cl.channel.pls[t];
            }
        }
    }
    if (!complete && callback) {
        this.socket.emit('gettrack', {'id': id}, function(d) {
            callback(d);
        });
    }

}
Client.prototype.getPlaylist = function(channel, callback) {
    cl = this;
    cl.callbacks.playlist = callback;
    this.socket.emit('getplaylist', {id: channel});
}
Client.prototype.goChannel = function(channel, callback) {
    var cl = this;
    cl.callbacks.channeldata = callback;
    this.socket.emit('gochannel', {id: channel});

}
Client.prototype.getChannels = function(callback) {
    var cl = this;
    cl.callbacks.channelsdata = callback;
    this.socket.emit('getchannels');
}
Client.prototype.getBlog = function(callback) {
    this.socket.emit('getposts', {}, callback);
}
Client.prototype.addPost = function(data, callback) {
    this.socket.emit('addpost', data, callback);
}
Client.prototype.addComment = function(data, callback) {
    this.socket.emit('addcomment', data, callback);
}
Client.prototype.getComments = function(data, callback) {
    this.socket.emit('getcomments', data, callback);
}
Client.prototype.killPost = function(idtokill, callback) {
    this.socket.emit('killpost', {id: idtokill}, callback);
}
Client.prototype.getChat = function(data, callback) {
    var cl = this;
    this.socket.emit('getchat', {'shift': data.shift, 'id': this.channel.chid}, function(data) {
        if (data.u) {
            cl.chat = data;
            cl.chat.id = cl.channel.chid;
        }
        callback(data);
    });
}
Client.prototype.sendMessage = function(message, callback) {
    var data = {'m': message};
    this.socket.emit('sendmessage', data, callback);
}
Client.prototype.tracksubmit = function(data, callback) {
    var form = data.form;
    this.socket.emit('tracksubmit', {'chid': this.channel.chid, 'track': data.track}, function(data) {
        data.form = form;
        console.log('data.form: ', data.form);
        callback(data)
    });
}
Client.prototype.addvote = function(data, callback) {
    if (this.user) {
        data.chid = this.channel.chid;
        this.socket.emit('vote', data);
    }
}
Client.prototype.adduservote = function(data, callback) {
    if (this.user) {
        this.callbacks.uvotedata = callback;
        this.socket.emit('uvote', data);
    }
}
Client.prototype.getUser = function(data, callback) {
    this.socket.emit('getuser', data, callback);
}
Client.prototype.getHistory = function(data, callback) {
    console.log(data);
    this.socket.emit('gethistory', {
        chid: this.channel.chid,
        s: data.shift,
        a: data.artist,
        t: data.title,
        top: data.top,
        g: data.gold,
        v: data.votes
    }, callback);
}
Client.prototype.getTags = function(str, callback) {
    cl = this;
    cl.callbacks.tags = callback;
    this.socket.emit('gettags', {s: str});
}
Client.prototype.getTrackTags = function(artist, title, callback) {
    var cl = this;
    cl.callbacks.tags = callback;
    this.socket.emit('gettags', {a: artist, t: title});
}
Client.prototype.addTag = function(str, callback) {
    cl = this;
    cl.callbacks.tags = callback;
    this.socket.emit('addtag', {s: str});
}
Client.prototype.killtrack = function(track) {
    cl = this;
    this.socket.emit('deltrack', {tid: track, chid: cl.channel.chid});
}
Client.prototype.sendinvite = function(mail, code, callback) {
    cl = this;
    cl.callbacks.invitestatus = callback;
    this.socket.emit('sendinvite', {m: mail, c: code});
}

Client.prototype.sendextinvite = function(data, callback) {
    this.socket.emit('sendextinvite', data, callback);
}

Client.prototype.logout = function(callback) {
    this.socket.emit('logout', {s: true}, callback);
}
Client.prototype.recover = function(mail, callback) {
    cl = this;
    cl.callbacks.recover = callback;
    this.socket.emit('recover', {m: mail});
}
Client.prototype.changepass = function(oldpass, newpass, callback) {
    cl = this;
    cl.callbacks.changepass = callback;
    this.socket.emit('changepass', {o: oldpass, n: newpass});
}
Client.prototype.updateUserData = function(data) {
    this.socket.emit('upduserdata', data);

}
Client.prototype.updateTrack = function(data) {
    this.socket.emit('updtrack', data);
}
Client.prototype.getchannel = function(id) {
    for (var i in this.channels) {
        if (this.channels[i].id == id) {
            return this.channels[i];
        }
    }
    return false;
}

Client.prototype.banuser = function(uid, reason, callback) {
    console.log(reason);
    this.socket.emit('banuser', {id: uid, r: reason}, callback);
}
Client.prototype.unbanuser = function(uid, callback) {
    this.socket.emit('unbanuser', {id: uid}, callback);
}
Client.prototype.setop = function(d, callback) {
    this.socket.emit('setop', d, callback);
}
Client.prototype.removeop = function(data, callback) {
    this.socket.emit('removeop', data, callback);
}

Client.prototype.setprops = function(data, callback) {
    this.socket.emit('setprops', data, callback);
}
Client.prototype.sendPRVote = function(data, callback) {
    this.socket.emit('prvote', data, callback);
}