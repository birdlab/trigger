var logpath='/home/trigger/logs/trigger.log';
var fs = require("fs");

exports.add = function(message) {
	var now=new Date();
	now=now.toJSON();
	console.log(now+' - '+message);

		fs.open(logpath, "a", 0644, function(err, file_handle) {
			if (!err) {
				fs.write(file_handle, now+' - '+message+"\n", null, 'utf8', function(err, written) {
					if (!err) {
						fs.close(file_handle);
					}
				});
			} 
		});
	
};
