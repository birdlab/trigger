var exec = require("child_process").exec;

var port=6600;
var testchanel=null;
var query=[];
var process=false;

function testplay(q){
	process=true;
	var shortpath=q.path.split('/');
	shortpath=shortpath[shortpath.length-1];
	console.log('test processing', shortpath);
	exec('mpc -p '+port+' update --wait', function(error, stdout, stderr){
		if (!error){
			exec('mpc -p '+port+' clear --wait', function(error, stdout, stderr){
				if (!error){
					exec('mpc -p '+port+' add "'+shortpath+'"',function(error, stdout, stderr){
						if (!error){
							exec('mpc -p '+port+' -f %time%  play', function(error, stdout, stderr){
								if (!error){
									var ans=stdout.split('\n');
									if (ans[1].substring(0,9)!='[playing]'){
										q.callback(false);
									} else {
										var ts=ans[0].split(':');
										var time=parseInt(ts[0])*60+parseInt(ts[1]);
										exec('mpc -p '+port+' stop', function(error, stdout, stderr){
											if (!error){
												process=false;
												if (query.length>0){
													testplay(query.shift());
												}
												q.callback(time);
											}
										});		
									}
								} else {
									process=false;
									console.log(error);
									q.callback(false);
									if (query.length>0){
													testplay(query.shift());
												}
								}
							});
						} else {
							process=false;
							console.log('------------------------error on add');
							console.log(error);
							q.callback(false);
							if (query.length>0){
													testplay(query.shift());
												}
						}
					});
				} else {
					process=false;
					console.log('------------------------error on clear');
					console.log(error);	
					q.callback(false);	
					if (query.length>0){
						testplay(query.shift());
					}
				}			
			});
		} else {
			if (check()){	
				testplay(q);
			} else {				
				setTimeout(function(){
					testplay(q);
				}, 1000);	
			}
		}
	});
} 
	

function check(){
	if (testchanel==null){
		exec('mpd --no-daemon /home/trigger/mpd/tester/mpd.conf', function(error, stdout, stderr){
			console.log(error);
			testchanel=null;
		});
		testchanel=true;
		return(false);		
	} else {
		return(true)
	}
}
exports.test = function(path, callback) {
	if (path){	
		var t={
			'path':path, 
			'callback':callback
		}
		query.push(t);
		if (!process){
			var q=query.shift();
			if (check()){	
				testplay(q);
			} else {				
				setTimeout(function(){
					testplay(q);
				}, 1000);	
			}		
		}
	}
};