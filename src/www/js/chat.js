var customCodes = [];

customCodes[0] = [];
customCodes[0][0] = /(http:\/\/[\w\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?(?:[\w])+\.(?:jpg|png|gif|jpeg|bmp))/gim;
customCodes[0][1] = '<a href="$1" target="_blank"><img src="$1" /></a>';

customCodes[1] = [];
customCodes[1][0] = /(https:\/\/[\w\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?(?:[\w])+\.(?:jpg|png|gif|jpeg|bmp))/gim;
customCodes[1][1] = '<a href="$1" target="_blank"><img src="$1" /></a>';

customCodes[2] = [];
customCodes[2][0] = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
customCodes[2][1] = '<a href="$1" target="_blank">$1</a>';

customCodes[3] = [];
customCodes[3][0] = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
customCodes[3][1] = '<a href="http://$1" target="_blank">$1</a>';

customCodes[4] = [];
customCodes[4][0] = /([\w\-\d]+\@[\w\-\d]+\.[\w\-\d]+)/gim;
customCodes[4][1] = '<a href="mailto:$1">$1</a>';

customCodes[5] = [];
customCodes[5][0] = '!!!!!!!!!!';
customCodes[5][1] = 'я идиот убейте меня кто нибудь! ';

customCodes[6] = [];
customCodes[6][0] = '))))))))))';
customCodes[6][1] = '<font color="pink">недавно я познакомился с мальчиком, у него такие голубые глаза и член который еле помещается в мою... кажется я не туда пишу</font> ';

customCodes[7] = [];
customCodes[7][0] = 'NO.';
customCodes[7][1] = '<img src="/img/no.jpg" />';

//customCodes[8] = [];
//customCodes[8][0] = /[<]\s*\\*\s*script\s*/gim;
//customCodes[8][1] = 'кулхацир в чати';


var messages = [];
var now = null;
var sound = new Audio();
var chatlogupdate = false;

function fillChat() {
    if (!($('#chatmessages').children().length) || client.channel.chid != client.chat.id) {
        client.getChat({}, function(d) {
            $('#chatmessages').html('');
            fillUserlist();
            chatlogupdate = true;
            for (var m in d.m) {
                var data = d.m[m];
                addMessage(data);
            }
            chatlogupdate = false;
            $('#messageinput').autofocus();
            if ($('#chatmessages').height() < $('.log').height()) {
                scrolltop();
            }
        });
    }
    $('#chattink').attr('checked', tink);
    $('#chatshowimg').attr('checked', !noimg);
}

function scrolltop() {
    if ($(this).scrollTop() < 300 && !chatlogupdate) {
        chatlogupdate = true;
        console.log($(this).scrollTop());
        var sh = Date(Date.parse(Date.now()));
        console.log('local ', sh);
        if (messages.length) {
            sh = new Date(Date.parse(client.chat.m[0].t) + timezone);
            var scroll = this;
            client.getChat({shift: sh}, function(data) {
                var delta = $('#chatmessages').height();
                console.log(delta);
                data.m.reverse();
                for (var i in data.m) {
                    client.chat.m.unshift(data.m[i]);
                    addMessage(data.m[i]);
                }
                delta = $('#chatmessages').height() - delta;
                $(scroll).scrollTop($(scroll).scrollTop() + delta);
                chatlogupdate = false;
            });
        }
    }
}

$(document).ready(function() {
    //  console.log($('#info .content.chat .log.nano'));
    $('#info .content.chat .log').scroll(scrolltop);
    // $(".nano").bind("scrolltop", scrolltop);
});


function submitMessage() {
    var command = false;
    $('#messageinput').val($('#messageinput').val().replace(/(\r\n|\n|\r)/gm, ""));
    var m = $.trim($('#messageinput').val()).replace('↵', '');
    if (m.replace('/tink', '') != m) {
        command = true;
        tink = !tink;
        settink();

    }
    if (m.replace('/noimg', '') != m) {
        command = true;
        noimg = !noimg;
        setnoimg();

    }

    if (!command) {

        client.sendMessage(m, function(data) {
            if (data.error) {
                $('#messageinput').attr("placeholder", data.error);
            } else {
                $('#messageinput').attr("placeholder", "начинай вводить...");
            }
        });

    }
    $('#messageinput').val($('#messageinput').val().match(/^(\>{1,2}[a-zA-Z0-9_.]+ )+/g) || '');
}


function fillUserlist() {
    $('#info .users .topline').html('<span>Здесь:' + client.chat.u.length + '</span>');
    $('#info .users .scroller').html('');
    mutelist = [];
    for (var us in client.chat.u) {
        var user = client.chat.u[us];
        var block = $('<div class="userblock"><span class="info">i</span><a href="javascript:addNick(\'' + user.n + '\');void(0);">' + user.n + '</a></div>').prependTo($('#info .scroller'));
        if (user.a) {
            block.addClass('active');
        }
        block.attr('userid', user.id);
        block.children('span.info').attr('userid', user.id);
        block.children('span.info').click(function() {
            getuser(parseInt($(this).attr('userid')));
        });

        var muted = $.Storage.get("muteuser" + user.id);
        if (muted) {
            block.children('span.info').css('background-color', '#cccccc');
            mutelist.push(user.id);
        }

    }
}

function refreshuser(data) {
    $("#info .users .scroller .userblock").each(function(index) {
        if ($(this).attr('userid') == data.uid) {
            if (data.a) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        }
    });


}

function addTr(id) {
    var text = $('#messageinput').val()
    if (text.replace('/track' + id, '') == text) {
        $('#messageinput').val(text + '/track' + id + ' ');
    }
    var to = $('#messageinput').val().length;
    $('#messageinput').selectRange(to, to);
    return false;
}

function addNick(name) {
    var text = $('#messageinput').val()
    if (text.replace('>' + name, '') == text) {
        $('#messageinput').val('>' + name + ' ' + text);
    } else {
        if (text.replace('>>' + name, '') == text) {
            $('#messageinput').val($('#messageinput').val().replace('>' + name, '>>' + name));
        } else {
            $('#messageinput').val($('#messageinput').val().replace('>>' + name, '>' + name));
        }
    }
    var to = $('#messageinput').val().length;
    $('#messageinput').selectRange(to, to);
    return false;
}
var meta = [];

function addMessage(md) {
    for (var i in mutelist) {
        if (mutelist[i] == md.uid) {
            return;
        }
    }
    var tome = false;
    md.uname = $.trim(md.uname);
    if (md.m) {
        if (md.pm) {
            if (client.user.n == md.pm) {
                tome = true;
                md.m = '<b class="private">&gt;&gt;' + md.pm + md.m.replace('&gt;&gt;' + md.pm, '') + '</b>';
            } else {
                md.m = '<div class="private">&gt;&gt;' + md.pm + md.m.replace('&gt;&gt;' + md.pm, '') + '</div>';
            }
        } else {
            if (md.m.replace('&gt;' + client.user.n, '') != md.m) {
                tome = true;
                md.m = '<b class="pm">>' + client.user.n + md.m.replace('&gt;' + client.user.n, '') + '</b>';
            }
        }
        for (var i = 0; i < customCodes.length; i++) {
            if (md.m.replace(customCodes[i][0], '') != md.m) {
                if (i < 2) {

                    if (noimg) {
                        var a = i + 2;
                        md.m = md.m.replace(customCodes[i][0], customCodes[a][1]);
                    } else {
                        md.m = md.m.replace(customCodes[i][0], customCodes[i][1]);
                    }
                    break;
                } else {
                    md.m = md.m.replace(customCodes[i][0], customCodes[i][1]);
                }
            }
        }
        var useraction = false;
        var replaceme = function() {
            if (md.m.replace('/me ', '') != md.m) {
                useraction = true;
                md.m = md.m.replace('/me', '<span onclick="return addNick(\'' + md.uname + '\')" >' + md.uname + '</span>');
                replaceme();
            }
        }
        replaceme();
        var pm = 'pm';
        if (!md.pm) {
            pm = '';
        }
        if (!useraction) {
            var message = $('<div class="message ' + md.uname + '"><table><tr><td class="names ' + pm + '"><span class="info">i</span><span onclick="return addNick(\'' + md.uname + '\')" >' + md.uname + ': </span></td><td class="sms">' + md.m + '</td><td class="mif"><div class="messageinfo"></div></td></tr></table></div>');
            meta[0] = /\/track(\w*)/gim;
            var analys = function() {
                var res = meta[i].exec(md.m);
                if (res) {
                    var str = '';
                    if (i == 0) {
                        client.track(parseInt(res[1]), function(tr) {
                            str = '<a href="#">' + tr.a + ' - ' + tr.t + '</a>';
                            var toupdate = $(message).find('.sms').html();
                            toupdate = toupdate.replace(res[0], str);
                            $(message).find('.sms').html(toupdate);
                            var href = $(message).find('a').attr('id', tr.id);
                            href.click(function() {
                                console.log('opening', tr);
                                opentrack(tr);
                            })
                        });
                    }
                }
            }
            for (var i in meta) {
                analys();
            }
        } else {
            var message = $('<div class="message ' + md.uname + '"><table><tr><td class="sms"><div class="action">' + md.m + '</div></td><td class="mif"><div class="messageinfo"></div></td></tr></table></div>');
        }
        message.find('span.info').click(function() {
            getuser(md.uid);
        });
        var info = message.find('.messageinfo');
        var trtm = null;
        $(info).mouseenter(function(e) {
            trtm = setTimeout(function() {
                console.log(md.tid);
                client.track(md.tid, function(data) {
                    $(info).html('<a href="#">' + data.a + ' - ' + data.t + '</a>');
                    $(info).find('a').click(function() {
                        opentrack(data);
                    })
                });
            }, 200);
        });
        $(info).mouseleave(function() {
            if (trtm) {
                clearTimeout(trtm);
            }
            updateMT(message);
        });
        message.time = new Date(md.t).getTime();
        if (messages.length) {
            if (message.time > messages[0].time) {
                if (tome && tink) {
                    if (sound.canPlayType('audio/ogg')) {
                        sound.src = '/sounds/tink.ogg';
                        sound.play();
                    } else {
                        sound.src = '/sounds/tink.mp3';
                        sound.play();
                    }
                }
                message.appendTo($('#chatmessages'));
                messages.push(message);
            } else {
                message.prependTo($('#chatmessages'));
            }
        } else {
            message.appendTo($('#chatmessages'));
            messages.push(message);
        }
        now = new Date().getTime();
        updateMT(message);
    }
}

function updateMT(message) {
    var delta = now - message.time;
    var timediv = $(message).find('.messageinfo');
    if (delta < 5000) {

        timediv.html('только что');
    }
    if (delta > 5000 && delta < 60000) {
        timediv.html(Math.round((now - message.time) / 1000) + ' секунд назад');
    }
    if (delta > 60000 && delta < 1800000) {
        var tm = Math.round((now - message.time) / 60000);
        var str = tm.toString();
        var ttm = parseInt(str[length - 1]);
        var mes = ' минут назад';
        if (tm < 2) {
            tm = '';
            mes = ' минуту назад';
        }
        if (tm > 1 && tm < 5) {
            mes = ' минуты назад';
        }
        timediv.html(tm + mes);
    }
    if (delta > 1800000 && delta < 3600000) {
        timediv.html('полчаса назад');
    }
    if (delta > 3600000 && delta < 7200000) {
        timediv.html('час назад');
    }
    if (delta > 7200000 && delta < 86400000) {
        if (delta < 10800000) {
            timediv.html(Math.round((now - message.time) / 3600000) + ' часа назад');
        } else {
            timediv.html(Math.round((now - message.time) / 3600000) + ' часов назад');
        }
    }
    if (delta > 86400000) {
        timediv.html(Math.round((now - message.time) / 86400000) + ' дней назад');
    }
}


function getTextSelection(el) {
    var start = 0, end = 0, normalizedValue, range,
        textInputRange, len, endRange;

    if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
        start = el.selectionStart;
        end = el.selectionEnd;
        if (start == end) {
            start = 0;
        }
    } else {
        range = document.selection.createRange();

        if (range && range.parentElement() == el) {
            len = el.value.length;
            normalizedValue = el.value.replace(/\r\n/g, "\n");

            textInputRange = el.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());

            endRange = el.createTextRange();
            endRange.collapse(false);

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart("character", -len);
                start += normalizedValue.slice(0, start).split("\n").length - 1;

                if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                    end = len;
                } else {
                    end = -textInputRange.moveEnd("character", -len);
                    end += normalizedValue.slice(0, end).split("\n").length - 1;
                }
            }
        }
    }
    return {'start': start, 'end': end};
}


var insertTag = {
    getCursor: function() {
        var result = {start: 0, end: 0};
        if (input.setSelectionRange) {
            result.start = input.selectionStart;
            result.end = input.selectionEnd;
        } else if (!document.selection) {
            return false;
        } else if (document.selection && document.selection.createRange) {
            var range = document.selection.createRange();
            var stored_range = range.duplicate();
            stored_range.moveToElementText(input);
            stored_range.setEndPoint('EndToEnd', range);
            result.start = stored_range.text.length - range.text.length;
            result.end = result.start + range.text.length;
        }
        ;
        return result;
    },
    setCursor: function(txtarea, start, end) {
        if (txtarea.createTextRange) {
            var range = txtarea.createTextRange();
            range.move("character", start);
            range.select();
        } else if (txtarea.selectionStart) {
            txtarea.setSelectionRange(start, end);
        }
        ;
    },
    tag: function(startTag, endTag) {
        var txtarea = document.getElementById("messageinput");
        txtarea.focus();
        var scrtop = txtarea.scrollTop;
        var cursorPos = getTextSelection(txtarea);
        var txt_pre = txtarea.value.substring(0, cursorPos.start);
        var txt_sel = txtarea.value.substring(cursorPos.start, cursorPos.end);
        var txt_aft = txtarea.value.substring(cursorPos.end);
        if (cursorPos.start == cursorPos.end) {
            var nuCursorPos = cursorPos.start + startTag.length;
        } else {
            var nuCursorPos = String(txt_pre + startTag + txt_sel + endTag).length;
        }
        ;
        txtarea.value = txt_pre + startTag + txt_sel + endTag + txt_aft;
        insertTag.setCursor(txtarea, nuCursorPos, nuCursorPos);
        if (scrtop) {
            txtarea.scrollTop = scrtop;
        }
        return false;
    }
};