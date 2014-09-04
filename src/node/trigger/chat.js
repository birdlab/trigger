var db = require('./dbdata.js');
var sockets = require('./sockets.js');
var sanitize = require('validator').sanitize;

function Chat() {
    this.messages = [];
    this.users = [];
    this.chatsockets = [];
    this.id = 0;
}

Chat.prototype.init = function(data) {
    this.id = data;
    var chat = this;
    var ct = new Date();
    db.getMessages(this.id, ct, function(messages) {
        chat.messages = messages;
    });
}

Chat.prototype.addMessage = function(message, user, callback) {

    var ct = new Date();
    message.t = ct;
    var isimage = message.m.match(/(http:\/\/[\w\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?(?:[\w])+\.(?:jpg|png|gif|jpeg|bmp))/gim || false);

    var isprivate = message.m.match(/^(\>{2}[a-zA-Z0-9_.]+)+/g || false);

    if (isimage && !isprivate) {
        user.imgcount += 1;
    } else {
        if (user.imgcount > 0) {
            user.imgcount -= .2;
        }
    }
    if (isprivate) {
        message.pm = isprivate.toString().replace('>>', '');
        sockets.sendMessage(message);
    } else {
        if (!(user.imgcount > 3 && isimage)) {
            this.messages.push(message);
            sockets.sendMessage(message);
            db.addMessage(message);
            if (this.messages.length > 50) {
                var mm = this.messages.shift();
            }
            if (callback) {
                callback({ok: true});
            }
        } else {
            user.imgcount -= 1;
            if (callback) {
                callback({error: 'слишком много картинок :('});
            }
        }
    }
}

Chat.prototype.addUser = function(socket) {
    var c = this;
    var finded = false;
    for (var s in c.chatsockets) {
        if (c.chatsockets[s].id == socket.id) {
            finded = true;
        }
    }
    if (!finded) {
        c.chatsockets.push(socket);
    } else {
    }
    for (var u in c.users) {
        if (socket.user.id == c.users[u].id) {
            return false;
        }
    }
    c.users.push(socket.user);
    sockets.sendNewUser(c.id, socket.user);


}
Chat.prototype.removeUser = function(socket) {
    var c = this;
    if (socket.user) {
        for (var s in c.chatsockets) {
            if (c.chatsockets[s].id == socket.id) {
                c.chatsockets.splice(s, 1);
                break;
            }
        }
        var stillthere = false;
        for (var su in socket.user.sockets) {
            var usersocketid = socket.user.sockets[su];
            for (var sc in c.chatsockets) {
                var scid = c.chatsockets[sc].id;
                if (!(scid != usersocketid)) {
                    stillthere = true;
                }
            }
        }
        if (!stillthere) {
            for (var u in c.users) {
                if (socket.user.id == c.users[u].id) {
                    c.users.splice(u, 1);
                    sockets.sendOffUser(c.id, socket.user);
                }
            }
        }
    }
}
Chat.prototype.getMessages = function(shift, callback) {
    var data = {};
    if (shift > 0) {
        if (shift) {
            db.getMessages(this.id, shift, function(messages) {
                data.m = messages;
                callback(data);
            });
        }
    } else {
        data.u = this.compactUsers()
        data.m = this.messages;
        callback(data);
    }

}
Chat.prototype.getActive = function() {
    var c = this;
    var act = 0;
    for (var u in c.users) {
        var active = false;
        var user = c.users[u];
        for (var s in c.chatsockets) {
            var socket = c.chatsockets[s];
            for (var d in user.sockets) {
                if (socket.id == user.sockets[d] && !active) {
                    active = socket.active;
                }
            }
        }
        if (active) {
            act += 1;
        }
    }
    return act;
}
Chat.prototype.compactUsers = function() {
    var c = this;
    var us = [];
    for (var u in c.users) {
        var active = false;
        var user = c.users[u];
        for (var s in c.chatsockets) {
            var socket = c.chatsockets[s];
            for (var d in user.sockets) {
                if (socket.id == user.sockets[d] && !active) {
                    active = socket.active;
                }
            }
        }
        us.push({id: c.users[u].id, n: c.users[u].name, a: active});
    }
    return us;
}

exports.newChat = function(id) {
    var ch = new Chat();
    ch.init(id);
    return ch;
};
