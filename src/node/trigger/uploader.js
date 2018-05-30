var http = require('http');
var formidable = require('formidable');
var fs = require('fs');

http.createServer(function (req, res) {
    console.log(req.url);
    if (req.url == '/nodeupload/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var newpath = '/home/trigger/upload/' + files.filetoupload.name;
            console.log(newpath);
            fs.rename(oldpath, newpath, function (err) {
                if (err) console.log(err);
                res.write('File uploaded and moved!');
                res.end();
            });
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8123);





var http = require('http');
var formidable = require('formidable');
var exec = require("child_process").exec;

http.createServer(function (req, res) {
    console.log(req.url);
    if (req.url == '/nodeupload/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var newpath = '/home/trigger/upload/' + files.filetoupload.name;
            console.log(newpath);
            exec('mv  "' + oldpath + '" "' + newpath + '"', function (error, stdout, stderr) {
                if (error) {console.log(err);} else{
                res.write('File uploaded and moved!');
                res.end();}
            });
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8123);