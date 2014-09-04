//try {

var fs = require("fs");
var sys = require("sys");
var exec = require("child_process").exec;
var io = require('socket.io').listen(40033, { log: true });
//var io = require('socket.io').listen(40032);
var check = require('validator').check;
var sanitize = require('validator').sanitize;
var clients=new Array();
var history=new Array();
var playlist=new Array();
var current;
var next;
var idcounter=0;
var start=true;
var magic=10;
var trackhistory=new Array();
var startcount=7318;

var activity=1800000;
var activeusers=[];
var streamlisteners=0;




var md5 = require('MD5');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '***REMOVED***',
  database : 'trigger'
});

connection.connect();

setInterval(timecontrol, 1000);
setInterval(checklistners, 10000);


function timecontrol(){
	if (current){
	current.time-=1;}
}

var files=[];
var p=0;

searchtracks();
checklistners();


function searchtracks(){
	exec('find /media/external/trigger -iname "*.mp3"', function(error, stdout, stderr){
		files=stdout.split('\n');
		processfiles(p);
	});
}
function processfiles(index){
	var file=files[index];
	if (p<files.length){
		p++;
	} else {
		console.log('complete');
	}
	var query='SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE path = "'+file+'"';
	connection.query(query, function(error, result, fields){
		if (error){
			console.log(error);
		} else {
			if (result.length>0){
				var currentTime = new Date();
				var track={
					'path':result[0].path,
					'id':result[0].id,
					'time':parseInt(result[0].time),
					'artist':result[0].artist,
					'title':result[0].title,
					'submiter':result[0].name,
					'submiterid':result[0].submiter,
					'postdate':currentTime.getTime(),
					'negative':[],
					'positive':[],
					'rating':0
				}
				var q='SELECT trackvote.value, trackvote.voterid, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid=\''+result[0].id+'\'';
				connection.query(q,function(error, result, fields){
					if (!error){
						var total=0;
						for (var r in result){
							var vote={
								'username':result[r].name,
								'userid':result[r].voterid
							}
							if (result[r].value>0){
								track.positive.push(vote);
							} else {
								track.negative.push(vote);
							}
							total+=result[r].value;
						}
						track.rating=total;
						playlist.push(track);
						console.log(playlist);
						refreshPlaylist();
						if (!next){	
							setNext();
						}
						if (p<files.length){
							processfiles(p);
						} else {
							sortTracks();
						}
					} 
				});	
			} else {
				console.log('NOT IN BASE '+ file);
				exec('rm -f "'+file+'"');
				if (p<files.length){
					processfiles(p);
				}
			}
		}
	});
}

function setNext(now){
	if (playlist.length>0){
		var track=playlist.shift();
		exec('mpc update --wait', function(error, stdout, stderr){
			if (!error) {
				exec('mpc crop', function(error, stdout, stderr){
					if (!error) {
						console.log(timeString());
						console.log("New next set - "+ track.artist+' - '+track.title);
						var shortpath=track.path.split('/');
						shortpath=shortpath[shortpath.length-1];	
						exec('mpc add "'+shortpath+'"', function(error, stdout, stderr){
							if (!error){
								if (!next){
									next=track;
									console.log('no next track! skiping!');
									exec('mpc next',function(error, stdout, stderr){
										if (!error){
											checkfile();
										}
									});
								} else {
									if (current){
										takerate(current);
									}
									current=next;
									next=track;
								};
								refreshPlaylist();	
							}
						});
					} 
				});
			} 
		});
	} 		
}

function refreshPlaylist(){
	var pl=[];
	for (var t in playlist){
		var track=playlist[t];
		pl.push(track);	
	}
	pl.unshift(next);
	io.sockets.emit('tracklistupdate', {
		'playlist':pl,
		'current':current
	});
}

function checkfile(){
	exec('mpc current --wait', function(error, stdout, stderr){
		if (!error){
			console.log(timeString());
			console.log('New track start playing!');
			console.log(stdout);
			setNext();	
			checkfile();			
		}
	});
}
function addinvite(userid){
	var code=md5("sds"+Math.random()*100000000000+"a");
	console.log(code);
	connection.query('insert into invites (parentid, code, give_time, userid) VALUES ('+userid+', "'+code+'", NOW(), 0)',function(error, result, fields){ 
		if (error){
			throw error;
		} 
	});	
}
function checklistners(){
	exec('php /home/www/birdlab/public/trigger/fastinfo.php', function(error, stdout, stderr){
		if(!error){
			if (stdout!=streamlisteners){
				streamlisteners=stdout;
				io.sockets.emit('listeners', {'listeners':streamlisteners});	
			}
		}
	});
}
function sendinvite(code, mail, socket){
	console.log('sending mail - '+mail);
	exec('php /home/www/birdlab/public/trigger/sendmail.php '+mail+' '+code, function(error, stdout, stderr){
		if(!error){
			connection.query('UPDATE invites SET  email="'+mail+'", send_time=NOW() WHERE  code = "'+code+'" LIMIT 1', function(error, result, fields){ 
				if (error){
					throw error;
				} 
				if (result){
					socket.emit('inviteok',{'message':'Твой инвайт ушел на мыло '+mail+'!'});
				}
			});
		}
	});
}


function takerate(track){
	if (track.positive.length>(activeusers.length/2)&&track.negative.length<2&&activeusers.length>9){
		var q='UPDATE  tracks SET  gold =  1, playdate = SELECT FROM_UNIXTIME(UNIX_TIMESTAMP(NOW()) - '+track.time*1000+') WHERE  tracks.id = \''+track.id+'\' LIMIT 1';
		connection.query(q,function(error, result, fields){});
		addinvite(track.submiterid);
	} else {
		var q='UPDATE  tracks SET  gold =  0, playdate = SELECT FROM_UNIXTIME(UNIX_TIMESTAMP(NOW()) - '+track.time*1000+') WHERE  tracks.id = \''+track.id+'\' LIMIT 1';
		connection.query(q,function(error, result, fields){});
	} 
	trackhistory.push(track);
	if (trackhistory.length>10){
	  	trackhistory.shift();
	}
	exec('rm -f "'+track.path+'"');

}
	
function sortFunction(a, b){

  if(a.rating<b.rating){return 1;}
  if(a.rating>b.rating){return -1;}
  if(a.rating==b.rating){
	  return parseInt(a.id)-parseInt(b.id);
  }
  return 0

}


function sortTracks(){
	if (playlist.length>1){
	if (current.rating<-magic||current.negative.length>(activeusers.length/2)||current.negative.length>current.positive.length){
		exec('rm -f "'+current.path+'"');
		exec('mpc next');	
	}
	var id=next.id;
	playlist.push(next);
	playlist.sort(sortFunction);
	for (var p in playlist){
		var currentTime = new Date();
		if (playlist[p]){
			if (playlist[p].postdate<currentTime-43200000){
				var track=playlist[p];
				exec('rm -f "'+track.path+'"');
				var q='DELETE FROM tracks WHERE id = \''+track.id+'\' LIMIT 1';
				connection.query(q,function(error, result, fields){ 
					if (!error){
						console.log(track.id+" deleted");
					}
				});
				playlist.splice(p,1);
			} else {
				if (playlist[p]){
					if (playlist[p].rating<-10){
						var track=playlist[p];
						var q='UPDATE  tracks SET  gold =  0 WHERE  tracks.id = \''+track.id+'\' LIMIT 1';
						connection.query(q,function(error, result, fields){});
						exec('rm -f "'+track.path+'"');
						playlist.splice(p,1);
					}
				}
			}
		}
	}
	next=playlist.shift();
	if (next){
		if (id!=next.id){
			exec('mpc update --wait', function(error, stdout, stderr){
			if (!error) {
				exec('mpc crop', function(error, stdout, stderr){
					if (!error) {
						console.log(timeString());
						console.log("New next set - "+ next.artist+' - '+next.title);
						console.log(next.path);
						var shortpath=next.path.split('/');
						shortpath=shortpath[shortpath.length-1];	
						exec('mpc add "'+shortpath+'"', function(error, stdout, stderr){
							if (error){
								console.log('error on adding new next (');
							} else {
								console.log(stdout);
							}
						});
					} else {
						console.log("Playlist update error");
					}
				});
			} else {
				console.log("Playlist can't be opened");
			}
		});
		}
	}
	}
	
}
function updatevotes(track){
	track.positive=[];
	track.negative=[];
	var q='SELECT trackvote.value, trackvote.voterid, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid=\''+track.id+'\'';
	connection.query(q,function(error, result, fields){
		if (!error){
			var total=0;
			for (var r in result){
				var vote={
					'username':result[r].name,
					'userid':result[r].voterid
				}
				if (result[r].value>0){
					track.positive.push(vote);
				} else {
					track.negative.push(vote);
				}
				total+=result[r].value;
			}
			track.rating=total;
			sortTracks();
			refreshPlaylist();
			
		}
	});	

}
function getuserinfo(data, socket){
	var q='SELECT sum(uservote.value) s, users.* FROM users LEFT JOIN uservote ON users.id=uservote.userid WHERE id=\''+data.id+'\'';
	connection.query(q, function(error, result, fields){
		if (error){
			throw error;  
		} else {
			if (result){
			   if (result[0].s==null){
				  result[0].s=0;
			   }
			   var userinfo={
				    	'id':data.id,
					    'name':result[0].name,
					    'gender':result[0].gender,
					    'country':result[0].country,
					    'city':result[0].city,
					    'rating':result[0].s,
					    'negative':[],
					    'positive':[],
					    'regdate':result[0].regdate
					    
				}
				for (var u in clients){
					if (data.id==clients[u].dbid) {
						clients[u].rating=parseInt(userinfo.rating);
					}
				}
				
				var q='SELECT uservote.voterid, uservote.value, users.name FROM uservote LEFT JOIN users ON uservote.voterid=users.id WHERE userid=\''+data.id+'\'';
				connection.query(q,function(error, result, fields){
					if (error){
						throw error;  
			  		} else {
				  		for (var r in result){
							var vote={
								'username':result[r].name,
								'userid':result[r].voterid
							}
							if (result[r].value>0){
								userinfo.positive.push(vote);
							} else {
								userinfo.negative.push(vote);
							}
						}
						if (socket.user) {
							if (data.id==socket.user.dbid){
								var query='SELECT * FROM invites WHERE parentid = '+socket.user.dbid;
								connection.query(query,function(error, res, fields){
									if (error){
										throw error;  
									} else {
										userinfo.invites=res;
										socket.emit('userinfo', userinfo);
									}
								});
							} else {
								socket.emit('userinfo', userinfo);
							}
						}
		    		}
				});
			    }
		    }
	    });
	
}

function addvote(track, socket, user, vote){
	 var q='SELECT count(trackvote.value) as tvote FROM trackvote WHERE trackvote.time BETWEEN NOW() - INTERVAL 1 DAY AND NOW() AND trackvote.voterid = '+socket.user.dbid+' union  SELECT count(uservote.value) as uvote FROM uservote WHERE uservote.date BETWEEN NOW( ) - INTERVAL 1 DAY AND NOW( ) AND uservote.voterid = '+socket.user.dbid;
	connection.query(q,function(error, result, fields){ 
		if (error){
			throw error;
		} else {
			if (result){
					all=parseInt(result[0].tvote)
					if (result[1]){
						all+=parseInt(result[1].tvote);
					}
					var r=socket.user.rating;
					if (r<1){
						r=1;
					}
					if (all>100*(Math.floor(Math.log(r))+1)){
						socket.emit('upload error',{'message':'У тебя кончился лимит, попробуй попозже'});
				    } else {
				    resetActivity(socket);
					    console.log(timeString());
					    var currentTime = new Date();
					    var ur=user.rating;
					    vote=vote*(Math.floor(Math.log(r))+1);
					    var query='SELECT * FROM trackvote WHERE trackid = \''+track.id+'\' and voterid = \''+user.dbid+'\'';
					    connection.query(query, function(error, result, fields){
							if (error){
				
							}
							if (result.length>0){
								if ((result[0].value>0&&vote>0)||(result[0].value<0&&vote<0)){
									var q='DELETE FROM trackvote WHERE trackvote.trackid = \''+track.id+'\' AND trackvote.voterid = \''+user.dbid+'\' LIMIT 1';
									connection.query(q,function(error, result, fields){ 
										if (!error){
											socket.processing=false;
											updatevotes(track);
										}
									});
								} else {
									var q='UPDATE  trackvote SET  value =   \''+vote+'\'  WHERE  trackvote.trackid = \''+track.id+'\'  AND  trackvote.voterid =\''+user.dbid+'\' LIMIT 1 ';
									connection.query(q,function(error, result, fields){ 
										if (!error){
											socket.processing=false;
											updatevotes(track);
										}
									});
								}
							} else {
								var q='INSERT INTO trackvote VALUES (\''+track.id+'\', \''+user.dbid+'\', \''+vote+'\', NULL)';
								connection.query(q,function(error, result, fields){ 
									if (!error){
										socket.processing=false;
										updatevotes(track);
									}
								});
							}
						});
 
					    
					    
					    
					    
					    
				    }
			}
		}
	});
		
}

function setuservote(socket,data){
			if (data.vote!=0){
				if (data.id!=socket.user.dbid){
					var query='SELECT * FROM uservote WHERE userid = \''+data.id+'\' and voterid = \''+socket.user.dbid+'\'';
					connection.query(query, function(error, result, fields){
						if (error){
							throw error;
						}
						if (result.length>0){
							if ((result[0].value>0&&data.vote>0)||(result[0].value<0&&data.vote<0)){
								var q='DELETE FROM uservote WHERE uservote.userid = \''+data.id+'\' AND uservote.voterid = \''+socket.user.dbid+'\' LIMIT 1';
								connection.query(q,function(error, result, fields){ 
									if (error){
										throw error;
									} else {
										socket.processing=false;
										getuserinfo({'id':data.id}, socket);
									}
								});
							} else {
								var q='UPDATE  uservote SET  value =   \''+data.vote+'\' WHERE  uservote.userid = \''+data.id+'\'  AND  uservote.voterid =\''+socket.user.dbid+'\' LIMIT 1 ';
								connection.query(q,function(error, result, fields){ 
									if (error){
										throw error;
									} else {
										socket.processing=false;
										getuserinfo({'id':data.id}, socket);
									}
								});
							}
						} else {
							var q='INSERT INTO uservote VALUES (\''+data.id+'\', \''+socket.user.dbid+'\', \''+data.vote+'\',NULL)';
							connection.query(q,function(error, result, fields){ 
								if (error){
									throw error;
								} else {
									socket.processing=false;
									getuserinfo({'id':data.id}, socket);
								}
							});
						}
					});
				} else {
					socket.processing=false;
				}
		}
	
}


function resetActivity(socket){
	if (socket.loged){
		var actuser=null;
		for (var c in activeusers){
			if (socket.user.dbid==activeusers[c].id){
				actuser=activeusers[c];
				break;
			}	
		}	
		if (actuser==null){
			actuser={};
			actuser.id=socket.user.dbid;
			activeusers.push(actuser);
		}
		socket.user.active=true;
		io.sockets.emit('updateusers', {
			'clients':clients,
			'active':activeusers.length
		});	
		if (actuser.timer){
	  		clearTimeout(actuser.timer);
	  	}	  	
		actuser.timer=setTimeout(
			function(){ 
				for (var a in clients){
					if (clients[a].dbid==actuser.id){
						clients[a].active=false;
					}	
				}	
				for (var b in activeusers){
					if (activeusers[b].id==actuser.id){
						activeusers.splice(b,1);
					}	
				}	
				io.sockets.emit('updateusers', {
					'clients':clients,
					'active':activeusers.length
				});		
			} 
		,activity);
		
	}
}

function timeString(){
	var ft=function (time){
		if (time<10){
			return("0"+time);
		} else {
			return(time);
		}
	}
	var currentTime = new Date();
  	return ft(currentTime.getHours())+':'+ft(currentTime.getMinutes())+':'+ft(currentTime.getSeconds());
}

io.sockets.on('connection', function (socket) {
	socket.loged=false;
	
	socket.emit('init', {
		'current':current
		,'listeners':streamlisteners 
		,'playlist':playlist
	});
	
	socket.processing=false;
	refreshPlaylist();
	
	socket.on('post', function (data) {
		if (socket.user&&socket.user.rating>-magic) {
  			data.date=timeString();
  			data.user=socket.user.username;
  			data.text = sanitize(data.text).xss();
  			data.text = sanitize(data.text).xss(true);
  			if (data.private){
  				if (data.touser>0){
  					io.sockets.emit('newmessage', data);
  				}
  			} else {
  				history.push(data);
  				if (history.length>50){
	  				history.shift();
	  			}
	  			resetActivity(socket);
	  			io.sockets.emit('newmessage', data);
	  			fs.open("/home/www/birdlab/public/trigger/chatlog.txt", "a", 0644, function(err, file_handle) {
					if (!err) {
						fs.write(file_handle, data.date+' '+data.user+": "+data.text+"\n", null, 'utf8', function(err, written) {
							if (!err) {
								fs.close(file_handle);
							}
						});
					} 
				});
			}
		}
	});
	socket.on('tracksubmit', function(data){
		if (data.path&&socket.user&&socket.user.rating>-magic){
			resetActivity(socket);
			var analyserror=false;
			var q='SELECT SUM(tracks.time) as sum  FROM `tracks` WHERE tracks.submiter = '+socket.user.dbid+' and tracks.date BETWEEN NOW( ) - INTERVAL 12 HOUR AND NOW( )';
			connection.query(q,function(error, result, fields){ 
				if (error){
					throw error;
				} else {
						if (result){
							var alltime=parseInt(result[0].sum);
							var r=socket.user.rating;
							if (r<1){
								r=1;
							} else {
								r=Math.log(r)+1;
							}
							if (alltime>(1200*r)){
								analyserror=true;
								socket.emit('upload error',{'message':'У тебя кончился лимит, попробуй попозже'});
							}
							if (!analyserror){
								artist=data.artist||"Unknown";
								title=data.title||"Noname";
								artist = sanitize(artist).xss();
								artist = sanitize(artist).xss(true);
								title = sanitize(title).xss();
								title = sanitize(title).xss(true);
								var currentTime = new Date();
								var track={
									'path':'/media/external/trigger/'+data.path,
									'submiter':socket.user.username,
									'submiterid':socket.user.dbid,
									'rating':0,
									'artist':artist,
									'title':title,
									'postdate':currentTime.getTime(),
									'negative':[],
									'positive':[]
								}
								for (var f in playlist){
									if (playlist[f].path==track.path){
										analyserror=true;
										socket.emit('upload error',{'message':'Такой трек прямо сейчас есть в плейлисте'});
									}
								}
								if (next.path==track.path||current.path==track.path){
									analyserror=true;
									socket.emit('upload error',{'message':'Такой трек прямо сейчас есть в плейлисте'});
								}
								exec('mp3info -p "%S\n" "'+track.path+'"', function(error, stdout, stderr){
									var time=parseInt(stdout);
									console.log('infotime '+time);
									track.time=time;
									if (track.time<5){
										analyserror=true;
										exec('rm -f "'+track.path+'"');
										socket.emit('upload error',{'message':'Слишком короткий трек'});
									} 
									if (!analyserror){
										connection.query('INSERT INTO tracks VALUES (NULL, ?, 1, 0, ?, ?, ?, ?, NOW(), NULL)',
											[track.path, 
											track.artist, 
											track.title, 
											track.time,
											socket.user.dbid],function(err, result){
																if (err){
																	console.log(err);  	
																} else { 
																	console.log(result);
																	track.id=result.insertId;
																	playlist.push(track);
																	console.log('new track add>>>');
																	console.log(track);
																	io.sockets.emit('newupload',{'track':track});
																	addvote(track, socket, socket.user, 1);
																}
															}
										);
									}
								});
							}	
						}	
					}
				});	
			}
	});
	socket.on('uservote', function(data){
		if (socket.user){
			if(socket.user.rating>-magic&&!socket.processing){
				socket.processing=true;
				setuservote(socket,data);	
			}
		}
	});
	socket.on('edituser', function(data){
		
	});
	socket.on('gethistory', function(data){	
		socket.emit('viewhistory', {'history':trackhistory});
		if (socket.user){
			resetActivity(socket);
		}
	});
	socket.on('vote', function(data){
		if (socket.user&&socket.user.rating>-10&&!socket.processing){
			socket.processing=true;
			if (current.id==data.id){
				addvote(current,socket, socket.user, data.vote);
			}
			if (next.id==data.id){
				addvote(next,socket, socket.user, data.vote);
			}
			for (var t in playlist){
				var track=playlist[t];
				if (track.id==data.id){
					addvote(track,socket, socket.user, data.vote);
				}
			}

		}
	});
    socket.on('getuserinfo', function (data) {  	
    	resetActivity(socket);
    	getuserinfo(data, socket);
    });
	socket.on('disconnect', function () {  
		for (var c in clients){
			if (socket.user==clients[c]){
				console.log('>>>> disconnected '+clients[c]);
				console.log(clients[c]);
				clients.splice(c,1);
				io.sockets.emit('userdisconnected', {
					'clients':clients,
    				'lostuser':socket.user.username
    			});
			}	
		}

    });
    socket.on('sendinvite', function (data) {    	
		sendinvite(data.code, data.mail, socket);
    });
    socket.on('login', function (data) { 
     	if (data.name&&data.pass){
    	var username=data.name;
    	
    	username = sanitize(username).xss();
    	username = sanitize(username).xss(true);
    	data.pass = sanitize(data.pass).xss();
    	data.pass = sanitize(data.pass).xss(true);
    	var password=md5(data.pass);
    	connection.query('SELECT * FROM users WHERE name = \''+username+'\'', function(error, result, fields){
	    	if (error){
		    	throw error;
		    }
		    if (result[0]){
		    	var dbrec=result[0];
		    	var rating=0;
		    	if (dbrec.password==password){
		    		var q='SELECT sum(uservote.value) s FROM uservote WHERE userid=\''+dbrec.id+'\'';
		    		connection.query(q,function(error, result, fields){
						if (!error){
							socket.loged=true;
							if (result[0].s>0){
								rating+=parseInt(result[0].s);
							}
							var user={
								'username':dbrec.name,
								'dbid':dbrec.id,
								'rating':rating
							};
							var q='SELECT SUM(tracks.time) as sum  FROM `tracks` WHERE tracks.submiter = '+user.dbid+' and tracks.date BETWEEN NOW( ) - INTERVAL 1 DAY AND NOW( )';
							connection.query(q,function(error, result, fields){ 
								if (error){
									throw error;
								} else {
									if (result){
										var r=user.rating
										if (r<1){
											r=1;
										} else {
											r=Math.log(r)+1;
										}
										var alltime=((600*r)-parseInt(result[0].sum));
										user.timelimit=alltime;
										var q='SELECT count(trackvote.value) as tvote FROM trackvote WHERE trackvote.time BETWEEN NOW() - INTERVAL 1 DAY AND NOW() AND trackvote.voterid = '+user.dbid+' union  SELECT count(uservote.value) as uvote FROM uservote WHERE uservote.date BETWEEN NOW( ) - INTERVAL 1 DAY AND NOW( ) AND uservote.voterid = '+user.dbid;
										connection.query(q,function(error, result, fields){ 
											if (error){
												throw error;
											} else {
												if (result){
													var all=0;
													all=parseInt(result[0].tvote)
													if (result[1]){
														all+=parseInt(result[1].tvote);
													}
													for (var c in clients){
														if (user.dbid==clients[c]){
															user.active=true;
															break;
														}	
													}
													console.log(timeString());
													console.log("user "+user.username+" karma "+user.rating+' comming');
													socket.user=user;
													var finded=false;
													for (var c in clients){
														if (socket.user.dbid==clients[c].dbid){
															finded=true;
															break;
														}	
													}
													if (!finded){
														clients.push(user);
													}
													for (var c in activeusers){
														if (socket.user.dbid==activeusers[c].id){
															socket.user.active=true;
															break;
														}	
													}	
													socket.emit('loginok', {
														'you':user
														,'history':history
														,'active':activeusers.length
														,'clients':clients
													});
													io.sockets.emit('updateusers', {
														'active':activeusers.length
														,'clients':clients
													});
												}
											}
										});
										
										
										
									}
								}
							});
							
						} else {
							console.log(error);
						}
					});		
				} else {
					socket.emit('loginerror', {'result':'nopass'});
				}
		    } else {
				socket.emit('loginerror', {'result':'nouser'});
			}
	    });
	    
}
    });
});

//} catch (err) {
//    console.log("Error:", err);
//}
