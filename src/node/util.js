/**
 * Created by Bird on 14.09.16.
 */
var db = require('./trigger/db.local.js');
var db = require('./trigger/dbdata.js');
var fs = require("fs");
var sys = require("sys");
var exec = require("child_process").exec;

exec('find /home/trigger/upload -iname "*.*"', function(error, stdout, stderr) {
    files = stdout.split('\n');
    for (var t in files) {
        ff = [];
        fs.stat(files[t], function(err, data) {
            if (data) {
                delta = new Date(new Date() - new Date(data.ctime)).getHours();
                console.log(delta);
                if (delta > 6) {
                    files[t] = files[t].split('/');
                    files[t] = files[t][files[t].length - 1];
                    console.log(files[t]);
                }

            }
        });
    }
});
