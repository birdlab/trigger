/**
 * Created by Bird on 13.09.14.
 */
$(document).ready(function() {

    jQuery.easing.def = "easeOutExpo";
    var setCurrent = function(track) {
        $('.artist').html(track.a);
        $('.title').html(track.t);

        var newHeader = track.a + ' - ' + track.t + ' @ Trigger';
        document.title = newHeader;
    }
    player = new Player();
    var vol = parseInt($.Storage.get("volume"));
    if (vol > 0) {
        vol = vol / 1000;
        $('#volume .slider .bar').width(vol * 100 + '%');
        player.volume(vol);
    }
    $('.streamcontrol .play').click(function() {
        player.play(client.channel.hi);
        $('.streamcontrol .play').hide();
        $('.streamcontrol .stop').show();
        $.Storage.set("play", 'true');
    });
    $('.streamcontrol .stop').click(function() {
        player.stop();
        $('.streamcontrol .stop').hide();
        $('.streamcontrol .play').show();
        $.Storage.set("play", 'false');
    });

    $('.streamcontrol .play').show();
    $('.streamcontrol .stop').hide();

    $('#volume .slider').bind('mousedown', function(e) {
        e.preventDefault();
        setvolume(e);
        $(window).bind('mousemove', setvolume);
        $(window).mouseup(function() {
            $(window).unbind('mousemove', setvolume);
        });
    });

    client = new Client();
    $(client).bind('welcome', function(event, data) {
        if (data) {
            var loc = location.host.split('.');
            if (loc[0] != 'trigger') {
                for (var ch in data.channels){
                    if(data.channels[ch].name==loc[0]){
                        console.log(location.origin);
                        $('#logo').append('<a href="'+location.origin+'" target="_blank"><sup>'+data.channels[ch].name+'</sup></a>');
                        client.goChannel(data.channels[ch].id, function(data) {
                            console.log('connected');
                            console.log(data)
                            setCurrent(data.current);
                            var startplay = $.Storage.get("play");
                            if (startplay == 'true') {
                                player.play(client.channel.hi);
                                $.Storage.set("play", 'false');
                                console.log('starting stream');
                                $('.streamcontrol .play').click();
                            }
                        });
                    }
                }

            } else {
                client.goChannel(1, function(data) {
                    console.log('connected');
                    console.log(data)
                    setCurrent(data.current);
                    var startplay = $.Storage.get("play");
                    if (startplay == 'true') {
                        player.play(client.channel.hi);
                        $.Storage.set("play", 'false');
                        console.log('starting stream');
                        $('.streamcontrol .play').click();
                    }
                });
            }
        }

    });

    $(client).bind('listners', function(event, data) {
        if (data.chid == client.channel.chid) {
            console.log('Слушают:', data.l, data.a);
        }
    });

    $(client).bind('newcurrent', function(event, data) {
        if (data.chid == client.channel.chid) {
            setCurrent(data.track);
        }
    });
    $(client).bind('cover', function(event, data) {
        console.log(data);
    });


    client.init(location.host);


    $(window).resize(function() {
        $('.sizer').css({'height': window.innerHeight});
    });

    $(window).resize();

});
