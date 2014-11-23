/**
 * Created by Bird on 24.11.14.
 */

function showHistory(g, shift) {
    $('.content.history').show();
    $('#info .tabs .tab').removeClass('active').children('a').removeClass('hover');
    $('#info .tabs .tab .content .history').addClass('active').children('a').addClass('hover');
    historyprocess = true;
    var sh = 0;
    if (shift) {
        sh = shift;
    }
    $('#info .content.history .list').html('');
    $('#info .content .loader').show(300);
    client.getHistory(sh, g, function(data) {
        $('#info .content .loader').hide(300);
        for (var t in data) {
            var track = data[t];
            addhistory(track);
        }
        historyprocess = false;
    });
}

function addhistory(track) {
    var item = $('<li class="item"></li>').appendTo('#info .content.history .list');
    var base = $('<div class="base"></div>').appendTo(item);
    var date = new Date(track.tt);
    base.append('<table><tr><td class="cover"><div class="artwork"><img src="img/nocover.png"></div></td><td class="name"><div class="artist">' + track.a + '</div><div class="title">' + track.t + '</div></td><td class="time">' + date + '</td><td class="rating"><div>' + track.r + '</div></td></tr></table>');


    var art = $(base).find('.artwork');
    if (track.g) {
        $(art).css('border', '2px solid #ffcd00');
    } else {
        $(art).css('border', '1px solid #aaa');
    }

    var inf = track.i;
    var full = $('<div class="full"></div>').appendTo(item);
    full.attr('id', track.id);

    if (client.user) {
        if (track.sid == client.user.id) {
            item.addClass('my');
        }
    }

    var voting = $('<div class="votebar"></div>').appendTo(full);

    var voters = $('<div class="voters"><ul class="nvotes"></ul><ul class="pvotes"></ul></div>').appendTo(voting);
    voters.hide();
    item.click(function() {
        voters.toggle();
    })
    var positivelist = $(voters).find(".pvotes");
    var negativelist = $(voters).find(".nvotes");
    for (var i in track.n) {
        $('<li><a href="javascript:getuser(' + track.n[i].vid + ');void(0);">' + track.n[i].n + '</a></li>').appendTo(negativelist);
    }
    for (var i in track.p) {
        $('<li><a href="javascript:getuser(' + track.p[i].vid + ');void(0);">' + track.p[i].n + '</a></li>').appendTo(positivelist);
    }

    var tags = $('<div class="tags"></div>').appendTo(full);
    var track_links = $('<div class="track_links"></div>').appendTo(full);
    var info = $('<div class="info">' + inf + '</div>').appendTo(full);
    full.append('<div class="sender">прнс <a href="javascript:getuser(' + track.sid + ');void(0);">' + track.s + '</a></div>');
    for (var t in track.tg) {
        var tagitem = $('<div class="tag">' + track.tg[t].n + '</div>').appendTo(tags);
        tagitem.attr('tagid', track.tg[t].id);
    }
    $('<span><a href="http://vk.com/audio?q=' + encodeURIComponent(track.a) + ' - ' + encodeURIComponent(track.t) + '" target="_blank">>vk</a></span>').appendTo(track_links);
    $('<span><a href="http://muzebra.com/search/?q=' + encodeURIComponent(track.a) + ' - ' + encodeURIComponent(track.t) + '" target="_blank">>muzebra</a></span>').appendTo(track_links);
    $('<span><a href="javascript:addTr(' + track.id + ');void(0);">>в чат</a></span>').appendTo(track_links);
    item.addClass('trackid' + track.id);
    lht = new Date(Date.parse(track.tt) + timezone);
    if (client.user) {
        for (var vr in track.p) {
            if (track.p[vr].vid == client.user.id) {
                base.find('.rating div').css('color', '#ffae00');
                break;
            }
        }
        for (var vr in track.n) {
            if (track.n[vr].vid == client.user.id) {
                base.find('.rating div').css('color', '#000000');
                break;
            }
        }
    }
}
