var db = require('./db.js');
var util = require('util');
var context = 1;
var learning = false;

function findmessage(message) {
    db.connection.query('SELECT date, context as cont FROM `botmind` WHERE MATCH (message) AGAINST (\'' + message + '\') LIMIT 1;',
        function(e, result, fields) {
            if (!e) {
                if (result.length) {
                    var q = 'SELECT message FROM `botmind` WHERE `context` = ' + result[0].cont + ' AND DATE > ' + db.connection.escape(result[0].date) + ' ORDER BY `date` LIMIT 1';
                    db.connection.query(q, function(e, result, fields) {
                        if (!e) {
                            if (result[0]) {
                                console.log(result[0].message);
                                addmessage(result[0].message);
                            } else {
                                learning = true;
                                console.log('?');
                            }
                        } else {
                            console.log(e);
                        }
                    });
                } else {
                    learning = true;
                    console.log('?');
                }
            } else {
                console.log(e);
            }
        });
}
function addmessage(message, c) {
    db.connection.query('INSERT INTO botmind (message, context) VALUES (\'' + message + '\' , ' + 1 + ');', function(e, result, fields) {
        if (!e) {
            if (learning) {
                console.log('я понял');
                learning = false;
            }
        } else {
            console.log(e);
        }
    });
}
function getNewContext(callback) {
    db.connection.query('SELECT context FROM botmind ORDER BY `context` DESC LIMIT 1', function(e, result, fields) {
        if (!e) {
            if (!result.length) {
                callback(0);
            } else {
                callback(parseInt(result[0].context) + 1);
            }
        } else {
            console.log(e);
        }
    });
}
process.stdin.resume();
process.stdin.setEncoding('utf8');
String.prototype.fulltrim = function() {
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
};
getNewContext(function(num) {
    console.log('new context - ', num);
    process.stdin.on('data', function(text) {
        if (text === 'q\n') {
            done();
        } else {
            text = text.fulltrim();
            if (learning) {
                addmessage(text);
            } else {
                addmessage(text);
                findmessage(text);
            }

        }

    });
});


function done() {
    console.log('Ok! Now EXIT ))).');
    process.exit();
}