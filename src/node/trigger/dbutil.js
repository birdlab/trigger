var db = require('./db.local.js');
var exec = require("child_process").exec;
var md5 = require('MD5');
var sanitizer = require('sanitizer');

var votes = [];
var tgs = [];
var count = 0;

function cleanVotes() {
    check = function() {
        var v = votes.pop();
        console.log(votes.length + ' - ' + (votes.length / count) * 100);
        db.connection.query('SELECT * FROM tracks WHERE id = ' + v.trackid, function(error, result, fields) {
                if (!error) {
                    if (result.length) {
                        console.log('Track ' + v.trackid + ' exists');
                        if (votes.length) {
                            check();
                        }

                    } else {
                        var q = 'DELETE FROM trackvote WHERE id = ' + v.id;
                        db.connection.query(q, function(e, r, f) {
                            if (!e) {
                                console.log('vote ' + v.id + ' deleted');
                            }
                            if (votes.length) {

                                check();
                            }
                        });
                    }
                }
            }
        );
    }
    var query = 'SELECT id, trackid FROM trackvote';
    db.connection.query(query, function(error, result, fields) {
        if (result) {
            votes = result;
            console.log('votes lenght - ', votes.length);
            count = votes.length;
            check();
        } else {
            console.log(error)
        }
    });
}


function cleanTags() {
    checkTags = function() {
        var v = tgs.pop();
        console.log(tgs.length + ' - ' + (tgs.length / count) * 100);
        db.connection.query('SELECT * FROM tracks WHERE id = ' + v.trackid, function(error, result, fields) {
                if (!error) {
                    if (result.length) {
                        console.log('Track ' + v.trackid + ' exists');
                        if (tgs.length) {
                            checkTags();
                        }
                    } else {
                        var q = 'DELETE FROM tracktags WHERE id = ' + v.id;
                        db.connection.query(q, function(e, r, f) {
                            if (!e) {
                                console.log('tag ' + v.id + ' deleted');
                            }

                            if (tgs.length) {

                               checkTags();
                            }
                        });
                       // console.log('no tracks for ', v);
                    }
                }
            }
        );
    }
    var query = 'SELECT * FROM tracktags';
    db.connection.query(query, function(error, result, fields) {
        if (result) {
            tgs = result;
            console.log('tags lenght - ', tgs.length);
            count = tgs.length;
            checkTags();
        } else {
            console.log(error)
        }
    });
}

function setRatings() {
    cT = function() {
        var v = tgs.pop();

        console.log(tgs.length + ' - ' + (tgs.length / count) * 100);
        console.log(v);
        var q = 'SELECT trackvote.value FROM trackvote WHERE trackid =' + v.id;
        db.connection.query(q, function(error, result, fields) {
                if (!error) {
                    if (result.length) {
                        var rating = 0;
                        var real = 0;
                        for (var a in result) {
                            rating += result[a].value;
                            if (result[a].value > 0) {
                                real += 1;
                            }
                            if (result[a].value < 0) {
                                real -= 1;
                            }

                        }
                        db.connection.query('UPDATE tracks SET rating =' + rating + ', realrating = ' + real + '  WHERE id = ' + v.id, function(err, result, fields) {
                            if (err) {
                                console.log('fail');
                                console.log(err);
                            } else {
                                console.log('track update ok');
                                if (tgs.length) {
                                    cT();
                                }
                            }
                        });


                    } else{
                        console.log('no votes for'+ v.id);
                        if (tgs.length) {
                            cT();
                        }
                    }
                } else {
                    console.log(error);
                }
            }
        );
    }
    var query = 'SELECT id FROM tracks';
    db.connection.query(query, function(error, result, fields) {
        if (result) {
            tgs = result;
            console.log('tracks lenght - ', tgs.length);
            count = tgs.length;
            cT();
        } else {
            console.log(error)
        }
    });
}

cleanTags();



