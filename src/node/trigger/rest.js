/**
 * Created by Bird on 31.01.15.
 */

var http = require('http'),
    fileSystem = require('fs'),
    path = require('path');

http.createServer(function(request, response) {
    console.log(request);
    var filePath='/home/trigger/www/sounds/tink.mp3';
    var stat = fileSystem.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(response);
}).listen(8008);
console.log('server started');

