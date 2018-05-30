/**
 * Created by Bird on 14.09.16.
 */



var exec = require("child_process").exec;
var db = require('./trigger/db.local.js');


var LastfmAPI = require('lastfmapi');


var files = [];

function setGold(path) {
    path = path.split('/')[path.split('/').length - 1];
    var q = 'SELECT tracks.id, tracks.channel, tracks.date, tracks.artist, tracks.title, tracks.gold, tracks.ondisk FROM tracks WHERE tracks.path LIKE \'%' + path + '%\' order by date desc'
    //console.log(q);
    db.connection.query(q, function (e, result, fields) {
        if (!e && result.length) {
            track = false
            for (var r in result) {
                if (result[r]['ondisk']) {
                    track = result[r];
                    setGold(files.shift());
                    break;
                }
            }
            if (!track) {
                console.log('process ' + path);
                console.log(result[0]);
                var q = "UPDATE tracks SET gold = " + db.connection.escape(1) + ", ondisk = " + db.connection.escape(1) + "  WHERE id =" + db.connection.escape(result[0]['id']);
                console.log(q);
                db.connection.query(q, function (e, r, fields) {
                    console.log('updated');
                    setGold(files.shift());
                });
            }
        } else {
            setGold(files.shift());
        }
    });
}


var lfm = new LastfmAPI({
    'api_key': '4366bdedfe39171be1b5581b52ddee90',
    'secret': '5def31e9198fa02af04873239bcb38f5'
});


function serachForImage(track) {
    if (track.album && track.album.image) {
        image = track.album.image;

        for (n = 0; n < image.length; ++n) {
            entry = image[n];
            if (entry.size == 'medium') {
                var p = entry["#text"];
                if (p.length > 0) {
                    return entry["#text"];
                }
            }
        }
        return false;
    } else {

        if (track.image) {
            image = track.image;
            for (n = 0; n < image.length; ++n) {
                entry = image[n];
                if (entry.size == 'medium') {
                    var p = entry["#text"];
                    if (p.length > 0) {
                        return entry["#text"];
                    }
                }
            }
        }
        console.log(track);
        return false
    }
}

offset = 0

function setCover() {
    var q = 'SELECT tracks.id, tracks.artist, tracks.title, tracks.coverlink FROM tracks WHERE tracks.coverlink IS NULL  ORDER BY id DESC LIMIT ' + offset + ', 1';
    console.log(q);
    db.connection.query(q, function (e, result, fields) {
        track = result[0];
        console.log(track);

        lfm.track.getInfo({
            'artist': track.artist,
            'track': track.title,
            'autocorrect': 1
        }, function (err, tr) {
            console.log(tr);
            if (tr) {
                img = serachForImage(tr);
                if (img) {
                    var q = 'UPDATE tracks set coverlink="' + db.connection.escape(img) + '" WHERE tracks.id = ' + track.id + ' limit 1';
                    console.log(q);
                    db.connection.query(q, function (e, result, fields) {
                        console.log(e);
                        console.log(result);

                    });
                } else {
                    lfm.artist.getInfo({
                        'artist': track.artist,
                        'autocorrect': 1
                    }, function (err, tr) {

                        if (tr) {
                            img = serachForImage(tr);
                            if (img) {
                                var q = 'UPDATE tracks set coverlink="' + db.connection.escape(img) + '" WHERE tracks.id = ' + track.id + ' limit 1';
                                console.log(q);
                                db.connection.query(q, function (e, result, fields) {
                                    console.log(e);
                                    console.log(result);

                                });
                            } else {
                                offset += 1;
                            }
                        }
                    })
                }
            } else {
                offset += 1
            }
            setCover();
        });


    });
}

var fs = require('fs');


function getCovers() {
    var q = 'SELECT * FROM tags WHERE tags.name LIKE "%cover%"';
    console.log(q);
    tags = [];

    db.connection.query(q, function (e, result, fields) {
        tags = result;
        for (tag in tags) {
            finalstr = '';
            finalstr += '\n--------------- ' + tags[tag]['name'] + ' --------------------------------\n';
            var q = 'SELECT * FROM tracktags WHERE tracktags.tagid =' + tags[tag]['id'];
            //console.log(q);
            isfiles = false;
            db.connection.query(q, function (e, result, fields) {
                tracks = result;
                trackids = [];
                for (tid in tracks) {
                    trackids.push(tracks[tid]['trackid'])
                }
                idsline = db.connection.escape(trackids.join());

                var q = 'SELECT * FROM tracks WHERE tracks.id  in (' + idsline + ')';
                console.log(q);

                db.connection.query(q, function (e, result, fields) {
                    trks = result;
                    console.log(trks);
                    if (trks) {
                        for (tr in trks) {
                            finalstr += trks[tr]['artist'] + ' - ' + trks[tr]['title'] + '\n';
                        }
                        console.log(finalstr);
                        fs.writeFile("/tmp/" + tags[tag]['name'] + '.txt', finalstr, function (err) {
                            if (err) {
                                return console.log(err);
                            }
                        });
                    }
                });
            });

        }

    });


}

getCovers();