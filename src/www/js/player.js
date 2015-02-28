Player = function(divname) {
    this.playing = false;
    this.vol = 0.5;
    this.prefix = '';
    this.mode = 'html5';
    this._mute = false;
    this.sound = new Audio();
    if (this.sound.canPlayType('audio/ogg')) {
    } else {
        this.prefix = 'mp3';
        if (this.sound.canPlayType('audio/mpeg')) {
        } else {
            this.flname = 'radio';
            this.mode = 'flash';
            swfobject.embedSWF("/js/radio.swf", "radio", "0", "0", "11.0.0");
        }
    }
    this.path = '';
    console.log(this.mode);
    return this;

};

Player.prototype = {

    constructor: Player,

    canplay: function(format) {
        var can = this.sound.canPlayType(format);
        return can;
    },
    play: function(path) {
        if (path) {
            this.path = path;
        } else {
            if (this.prefix=='mp3'){
                this.path=client.channel.low;
            } else {
                this.path=client.channel.hi;
            }
        }
        this.sound.src = this.path;
        this.sound.loop = 'loop';
        this.sound.play();
        this.playing = true;
        $('.streamcontrol .play').hide();
        $('.streamcontrol .stop').show();

    },


    stop: function() {
        if (this.mode == 'flash') {
            getflashinstance(this.flname).stop();
        } else {
            this.sound.pause();
            this.sound.src = '';
        }
        this.playing = false;
    },
    volume: function(vol) {
        if (vol) {
            this.vol = vol;
            if (this.mode == 'flash') {
                var p = this;
                if (getflashinstance(this.flname)) {
                    try {
                        getflashinstance(this.flname).volume(vol);
                    } catch (err) {
                    }
                } else {
                    setTimeout(function() {
                        p.volume(p.vol);
                    }, 400);
                }
            } else {
                this.sound.volume = vol;
            }

        } else {
            return this.vol;
        }
    },
    mute: function(bol) {
        if (bol != this._mute) {
            this._mute = bol;

            if (this._mute) {
                this.stop();
            } else {
                var targetvol = this.vol;
                this.vol = 0;
                this.fade(targetvol);
                this.play(this.path);
            }
        }
    },
    fade: function(to) {
        var player = this;
        this.volume(this.vol + (to - this.vol) / 30);
        if (Math.abs(this.vol - to) > 0.01) {
            player.to = to;
            setTimeout(function() {
                console.log(player.to);
                console.log(player.vol);
                player.fade(player.to);
            }, 50);
        }
    }


};
function getflashinstance(name) {
    if (navigator.appName.indexOf("Microsoft") != -1) {
        return window[name];
    } else {
        return document[name];
    }
};

function setvolume(e) {
    var pos = e.pageX - $('#volume .slider')[0].offsetLeft;
    if (pos < 0) {
        pos = 0;
    }
    if (pos > 125) {
        pos = 125;
    }
    $('#volume .slider .bar').width(pos);
    player.volume(pos / 125);
    $.Storage.set("volume", (pos / 125) * 1000 + ' ');

}
function handle_storage(e) {
    if (!e) {
        e = window.event;
    }
    if (e.key == 'play' && e.newValue == "true") {
        player.stop();
        $('#console .streamcontrol .stop').hide();
        $('#console .streamcontrol .play').show();
    }
}

if (window.addEventListener) {
    window.addEventListener("storage", handle_storage, false);
} else {
    window.attachEvent("onstorage", handle_storage);
}
;

