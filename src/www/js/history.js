/**
 * Created by Bird on 24.11.14.
 */

var inputlimit = false, historyneedupdate = false, historytimeout = false, topcounter = 0, topvotes = false;

$(document).ready(function () {
    $('#showgold').bind('click', function () {
        if (!historyprocess) {
            showHistory($('#showgold').is(':checked'), $('#showtop').is(':checked'));
        }
    });
    $('#showtop').bind('click', function () {
        if (!historyprocess) {
            showHistory($('#showgold').is(':checked'), $('#showtop').is(':checked'));
        }
    });
    $('#topswitch').bind('click', function () {
        if (!historyprocess) {
            $('#showtop').prop('checked', true);
            topvotes = !topvotes;
            if (topvotes) {
                $('#topswitch').html('по голосам');
            } else {
                $('#topswitch').html('по рейтингу');
            }
            showHistory($('#showgold').is(':checked'), $('#showtop').is(':checked'));
        }
    });

    $('#info .content.history .inner').scroll(function () {
        if ($(this).children('.list').height() - $(this).scrollTop() - $(this).height() < 300 && !historyprocess) {
            historyprocess = true;
            var data = {
                shift: lht,
                artist: $('#hpanel .finput.artist').val(),
                title: $('#hpanel .finput.title').val(),
                gold: $('#showgold').is(':checked'),
                top: $('#showtop').is(':checked'),
                votes: topvotes
            }
            if (data.top) {
                data.shift = $('#info .content.history .list .item').length;
            }
            client.getHistory(data, function (data) {

                if (data.e) {
                    console.log(data.e);
                } else {
                    for (var t in data) {
                        addhistory(data[t]);
                    }
                }
                historyprocess = false;
            });
        }
    });
    $('#hpanel .finput').keyup(function (data) {
        updatehistory();
    });

});

function updatehistory() {
    if (historytimeout) {
        clearTimeout(historytimeout);
    }
    historytimeout = setTimeout(function () {
        var data = {
            shift: 0,
            artist: $('#hpanel .finput.artist').val(),
            title: $('#hpanel .finput.title').val(),
            gold: $('#showgold').is(':checked'),
            top: $('#showtop').is(':checked'),
            votes: topvotes
        }
        $('#info .content.history .list').html('');
        client.getHistory(data, function (data) {
            console.log(data);
            if (!data.e) {
                for (var t in data) {
                    var track = data[t];
                    addhistory(track);
                }
            } else {
                console.log(data.e);
            }
            historyprocess = false;
        });
    }, 500);
}


function showHistory(g, top, shift) {
    $('.content').hide();
    $('.content.history').show();
    $('#info .tabs .tab').removeClass('active').children('a').removeClass('hover');
    $('#info .tabs .tab.history').addClass('active').children('a').addClass('hover');
    historyprocess = true;
    var sh = 0;
    if (shift) {
        sh = shift;
   } else {
        topcounter = 0;
    }
    var data = {
        shift: sh,
        artist: $('#hpanel .finput.artist').val(),
        title: $('#hpanel .finput.title').val(),
        gold: $('#showgold').is(':checked'),
        top: $('#showtop').is(':checked'),
        votes: topvotes
    }
    $('#info .content.history .list').html('');
    client.getHistory(data, function (data) {
        if (!data.e) {
            for (var t in data) {
                var track = data[t];
                addhistory(track);
            }
        } else {
            console.log(data.e);
        }
        historyprocess = false;
    });
}

function addOnDisk(id, item) {
    console.log(id);
    client.addOnDisk(id, function(a){
        console.log(a)
    });

}

function addhistory(track) {
    if (track.p) {
        topcounter++;
        var topcount = '';
        if ($('#showtop').is(':checked')) {
            topcount = '<td class="counter">' + topcounter + '</td>';
        }
        var item = $('<li class="item"></li>').appendTo('#info .content.history .list');
        var base = $('<div class="base"></div>').appendTo(item);
        var date = moment(track.tt).calendar();
        track.rr = track.p.length - track.n.length;
        cover = "img/nocover.png";
        if (track.co) {
            cover = track.co;
        }
        base.append('<table><tr>' + topcount + '<td class="cover"><div class="artwork"><img src=' + cover + '></div></td><td class="name"><div class="artist">' + track.a + '</div><div class="title">' + track.t + '</div></td><td class="time">' + date + '</td><td class="rating"><div>' + track.r + '<span class="real">/' + track.rr + '</span></div></td></tr></table>');
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
        item.click(function () {
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
        var uploadverbal=moment(track.ut).subtract(3, 'hour').from();
        full.append('<div class="sender">прнс <a href="javascript:getuser(' + track.sid + ');void(0);">' + track.s + '</a> <span class="howold">'+uploadverbal+'</span></div>');
        for (var t in track.tg) {
            var tagitem = $('<div class="tag">' + track.tg[t].n + '</div>').appendTo(tags);
            tagitem.attr('tagid', track.tg[t].id);
        }
        var titleURI = encodeURIComponent(track.t).replace('amp%3B', '');
        var artistURI = encodeURIComponent(track.a).replace('amp%3B', '');
        $('<span><a href="http://vk.com/audio?q=' + artistURI + ' - ' + titleURI + '" target="_blank">>vk</a></span>').appendTo(track_links);
        $('<span><a href="https://www.youtube.com/results?search_query=' + encodeURIComponent(track.a) + ' - ' + encodeURIComponent(track.t) + '" target="_blank">>youtube</a></span>').appendTo(track_links);
        $('<span><a href="https://play.google.com/music/listen?u=0#/sr/' + encodeURIComponent(track.a) + ' - ' + encodeURIComponent(track.t) + '" target="_blank">>googlemusic</a></span>').appendTo(track_links);
        $('<span><a href="javascript:addTr(' + track.id + ');void(0);">>в чат</a></span>').appendTo(track_links);
        if (track.od && (track.sid == client.user.id || client.user.id==1 || client.user.prch || client.user.opch)) {
            $('<span class="ondisklink"><a href="javascript:addOnDisk(' + track.id + ');void(0);">>в эфир</a></span>').appendTo(track_links);
        }
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
}
