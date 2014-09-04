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
customCodes[6][1] = '<font color="pink">недавно я познакомился с мальчиком, у него такие голубе глаза и член который... кажется я не туда пишу</font> ';

customCodes[7] = [];
customCodes[7][0] = 'NO.';
customCodes[7][1] = '<img src="/img/no.jpg" />';




var messages = [];
var now = null;
var sound = new Audio();

function playTink() {
    if (sound.canPlayType('audio/ogg')) {
        sound.src = '/sounds/tink.ogg';
        sound.play();
    } else {
        sound.src = '/sounds/tink.mp3';
        sound.play();
    }
}

$(document).ready(function() {
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
        for (var i = 0; i < customCodes.length; i++) {
            if (m.replace(customCodes[i][0], '') != m) {
                m = m.replace(customCodes[i][0], customCodes[i][1]);
                if (i < 2) {
                    break;
                }
            }
        }

        client.sendMessage(m, function(data){
            if (data.error){
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
    md.uname = $.trim(md.uname);
    if (md.m) {
        if (md.pm) {
            if (client.user.n == md.pm) {
                if (tink) {
                    playTink();
                }
                md.m = '<b style="color:#8d8d8d">>>' + md.pm + md.m.replace('>>' + md.pm, '') + '</b>';
            } else {
                md.m = '<div style="color:#8d8d8d">>>' + md.pm + md.m.replace('>>' + md.pm, '') + '</div>';
            }
        } else {
            if (md.m.replace('>' + client.user.n, '') != md.m) {
                if (tink) {
                    playTink();
                }
                md.m = '<b style="color:black">>' + client.user.n + md.m.replace('>' + client.user.n, '') + '</b>';
            }
        }
        var useraction = false;
        var replaceme = function() {
            if (md.m.replace('/me', '') != md.m) {
                useraction = true;
                md.m = md.m.replace('/me', '<span onclick="return addNick(\'' + md.uname + '\')" >' + md.uname + '</span>');
                replaceme();
            }
        }
        replaceme();
        if (!useraction) {
            meta[0] = /\/track(\w*)/gim;
            var analys = function() {
                var res = meta[i].exec(md.m);
                if (res) {
                    var str = '';
                    if (i == 0) {
                        var tr = client.track(parseInt(res[1]));
                        str = '<a href="javascript:opentrack(' + tr.id + ');void(0);">' + tr.a + ' - ' + tr.t + '</a>';
                    }
                    md.m = md.m.replace(res[0], str);
                    analys();
                }
            }
            for (var i in meta) {
                analys();
            }
            var pm = 'pm';
            if (!md.pm) {
                pm = '';
            }
            var message = $('<div class="message ' + md.uname + '"><table><tr><td class="names '+pm+'"><span onclick="return addNick(\'' + md.uname + '\')" >' + md.uname + ': </span></td><td class="sms">' + md.m + '</td><td class="mif"><div class="messageinfo"></div></td></tr></table></div>');
        } else {
            var message = $('<div class="message ' + md.uname + '"><table><tr><td class="sms"><div class="action">' + md.m + '</div></td><td class="mif"><div class="messageinfo"></div></td></tr></table></div>');
        }
        message.time = new Date(md.t).getTime();
        if (messages.length) {
            if (message.time > messages[0].time) {
                message.appendTo($('#chatmessages'));
                messages.push(message);
            } else {
                message.prependTo($('#chatmessages'));
            }
        } else {
            message.appendTo($('#chatmessages'));
            messages.push(message);
        }
        if (noimg) {
            message.find("img").css('display', 'none').after('<span class="pc">картинка</span>');
        }
        now = new Date().getTime();
        upadateMT(message);
    }
}

function upadateMT(message) {
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
    if (delta > 7200000) {
        if (delta < 10800000) {
            timediv.html(Math.round((now - message.time) / 3600000) + ' часа назад');
        } else {
            timediv.html(Math.round((now - message.time) / 3600000) + ' часов назад');
        }
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