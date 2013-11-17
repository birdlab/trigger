var db=require('./db.local.js');
var user=require('./user.js');
var exec = require("child_process").exec;
var md5 = require('MD5');
var sanitize = require('validator').sanitize;

var voteq=[];
var uvoteq=[];

var vprocess=false;
var uvprocess=false;

exports.updatelimits=function(userid, callback){
	var data={};
	var q="SELECT SUM(tracks.time) as sum,(select tracks.date from tracks where tracks.submiter = "+userid+" and tracks.channel=1 and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW() limit 0,1) as lastime, (Select SUM(tracks.time) FROM `tracks` WHERE tracks.submiter = "+userid+" and tracks.channel=1 and tracks.gold=b'1' and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()) as goldsum FROM `tracks` WHERE tracks.submiter ="+userid+" and tracks.channel=1 and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()";
	db.connection.query(q,function(error, result, fields){ 
		if (!error){
			data.time=result[0].sum||0;
			var goldtime=result[0].goldsum||0;
			data.time=data.time-goldtime*2;
			var last=new Date(result[0].lastime);
			if (Date.parse(last)>0){
				var now= new Date();
				var shift=new Date((Date.parse(last)+1000+(3600*12*1000))-Date.parse(now));
				data.next=Date.parse(shift);
			} else {
				data.next=0;
			}
			
			callback(data);
		} else {
			callback({'error':error});
		}
	});
}



function getinvites(id,callback){
	db.connection.query('SELECT invites.*, users.name FROM invites LEFT JOIN users ON invites.userid=users.id WHERE parentid = '+id, function(e, result, fields){
		var invites={ u:[], i:[]};
		if (!e){
			
			for (var i in result){
				var invite={
					c:result[i].code
				}
				if (new Date(result[i].send_time).getTime()<0){
					invites.i.push(result[i].code);
				} else {
					if (new Date(result[i].activated_time).getTime()>0){
						invites.u.push({
							id:result[i].userid,
							n:result[i].name
						});
					}
				}
			}
			db.connection.query('SELECT users.id, users.name FROM users WHERE users.id IN (SELECT invites.parentid from invites where userid='+id+');', function(err, r, f){
				if (!err){
					if (r[0]){
						invites.p=r[0];
					}
				}
				callback(invites);
			});
			
		} else {
			console.log(e);
			callback(invites);
		}
	});
}

exports.getInvites=function(id, callback){
	getinvites(id,callback);
}

exports.getuser= function(id, callback){
	db.connection.query('SELECT * FROM users WHERE id = '+id, function(e, result, fields){
    	if (!e){
	    	if (result[0]){
		    	var dbrec=result[0];
		    		var qu='SELECT voterid, value, users.name  FROM uservote LEFT JOIN users ON uservote.voterid=users.id WHERE userid='+dbrec.id;
		    		db.connection.query(qu,function(error, res, fields){
		    			if (!error){
		    				var us=user.newUser({
			    				name:dbrec.name,
			    				pass:dbrec.password,
			    				id:dbrec.id,
			    				country:dbrec.country,
			    				city:dbrec.city,
			    				regdate:dbrec.regdate,
			    				email:dbrec.email,
			    				gender:dbrec.gender[0]==1,
			    				votes:res
			    			});	
			    			callback({'user':us});	
			    		} else {
				    		callback({'error':'database fail'});
			    		}
			    	});
		     
	    	} else {
		    	callback({'error':'nouser'});
	    	}
	    } else {
			callback({'error':'database fail'});
		}
	});
}

exports.getstats=function(userid, callback){
    db.connection.query('SELECT count(*) as "count" FROM tracks WHERE tracks.submiter='+userid, function(e, r, fields){
    	var count=r[0].count;
    	db.connection.query('select sum(trackvote.value) as "rating" FROM trackvote where trackvote.trackid in (SELECT tracks.id FROM tracks WHERE tracks.submiter='+userid+');', function(e, result, fields){
    		var rating=result[0].rating;
    		callback({trx:count, rt:(rating/count).toFixed(3)});
    	}); 
    	
	});
}


exports.login=function(data, callback){
	var username = data.u/*.xss()*/;
    var password = data.p/*.xss()*/;
    db.connection.query('SELECT * FROM users WHERE name = \''+username+'\'', function(e, result, fields){
    	if (!e){
	    	if (result[0]){
		    	var dbrec=result[0];
		    	if (dbrec.password==password){
		    		db.connection.query('SELECT voterid, value, users.name  FROM uservote LEFT JOIN users ON uservote.voterid=users.id WHERE userid='+dbrec.id,function(error, res, fields){
		    			if (!error){
		    				var us=user.newUser({
			    				name:username,
			    				pass:password,
			    				id:dbrec.id,
			    				country:dbrec.country,
			    				city:dbrec.city,
			    				regdate:dbrec.regdate,
			    				email:dbrec.email,
			    				gender:dbrec.gender[0]==1,
			    				votes:res
			    			});
				    		callback({'user':us});
			    		} else {
				    		callback({'error':'database fail'});
			    		}
			    	});
		    	} else {
			    	callback({'error':'wrongpass'});
		    	}
	    	} else {
		    	callback({'error':'nouser'});
	    	}
	    } else {
			callback({'error':'database fail'});
		}
	});
}


exports.addMessage = function(message){
	var q='INSERT INTO chat (channelid, userid, message,trackid) VALUES ('+message.chid+','+message.uid+',\''+message.m+'\','+message.tid+')';
	db.connection.query(q, function(e, result, fields){
		if (e){
			console.log('history insert error - ', e,result,fields);
		}
	});	
	
}

exports.getMessages = function(id, shift, callback){
	var q='SELECT chat.*, users.name FROM chat LEFT JOIN users ON chat.userid=users.id WHERE date <'+db.connection.escape(shift)+' AND channelid='+id+' ORDER BY date DESC LIMIT 50';
	console.log(q);
	db.connection.query(q, function(e, result, fields){
		var data=[];
		for (var m in result){
			var mes=result[m];
			data.unshift({
				chid:mes.channelid,
				uid:mes.userid,
				uname:mes.name,
				m:mes.message,
				t:mes.date,
				tid:mes.trackid
			})
		}
		callback(data)
	});	
	
}

function getTracksFromQery(q, callback){
	db.connection.query(q,function(error, result, fields){ 
		if (!error){
			var ids='';
			var tracks=[];
			for (var t in result){
				tracks.push({
					a:result[t].artist,
					t:result[t].title,
					i:result[t].info,
					tt:result[t].playdate,
					s:result[t].name,
					p:[],
					n:[],
					tg:[],
					id:result[t].id,
					chid:result[t].channel,
					sid:result[t].submiter,
					g:result[t].gold[0]==1,
					r:0
				});				
				ids+=result[t].id+',';
			}
			ids=ids.slice(0,-1);
			var q='SELECT trackvote.*, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid in ('+ids+')';
			db.connection.query(q,function(error, result, fields){ 
				if (!error){
					for (var v in result){		
						for (var t in tracks){
							if (result[v].trackid==tracks[t].id){
								var vote={
										'vid':result[v].voterid,
										'n':result[v].name,
										'v':result[v].value
									};
								if (result[v].value>0){
									tracks[t].p.push(vote);
								} else {
									tracks[t].n.push(vote);
								}
								tracks[t].r+=result[v].value;
								break;
							}
						}	
					}
					var req='SELECT tracktags.trackid, tracktags.tagid, tags.name FROM tracktags LEFT JOIN tags ON tracktags.tagid=tags.id WHERE trackid in ('+ids+')';
					db.connection.query(req ,function(err, res, fields){ 
						if (!err){
							for (var v in res){		
								for (var t in tracks){
									var tag={
										'id':res[v].id,
										'n':res[v].name
									};
									if (res[v].trackid==tracks[t].id){
										tracks[t].tg.push(tag);
									}
								}
							}
							callback(tracks);	
						} else {
							console.log(error);
						}
					});
					
				} else {
					console.log(error);
				}
			});
		} else {
			console.log(error);
		}
	});
	
}
exports.getVoted=function(id, shift, positive, callback){
	var p='<';
	if (positive){
		p='>';
	}
	var q='SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.id IN (SELECT trackvote.trackid FROM trackvote WHERE trackvote.voterid='+id+' and trackvote.value '+p+' 0) AND tracks.submiter!='+id+' AND tracks.date < '+db.connection.escape(shift)+' ORDER BY tracks.date DESC limit 20';
	getTracksFromQery(q, callback);	
	
}
exports.getuploads=function(id, shift, callback){
	var q='SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.submiter='+id+' AND tracks.playdate < '+db.connection.escape(shift)+' order by tracks.playdate desc LIMIT 20';
	getTracksFromQery(q, callback);	
}

exports.getTracksByShift = function(channel,shift, callback){
	var q='SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE tracks.channel='+channel+' AND tracks.playdate < '+db.connection.escape(shift)+' order by tracks.playdate desc LIMIT 20';
	getTracksFromQery(q, callback);	
}


exports.getChannels=function(callback){
	var q='SELECT * FROM `channels`';
	db.connection.query(q,function(error, result, fields){ 
		if (!error){
			callback(result);
		} else {
			console.log(error);
		}
	});
}
function processUserVote(){
	if (!uvprocess){
		uvprocess=true;
		if (uvoteq.length>0){
			var vote=uvoteq.pop();
			console.log('uservote to base', vote);
			if (vote.v){
				var q='SELECT * FROM uservote WHERE uservote.userid = \''+vote.id+'\' AND uservote.voterid = \''+vote.user.id+'\'';
				db.connection.query(q, function(e, result, fields){
					if (!e){
						console.log(result);
						if (result.length>0){
							var qq='UPDATE uservote SET value = \''+vote.v+'\' WHERE uservote.userid = \''+vote.id+'\' AND voterid = \''+vote.user.id+'\'';
							db.connection.query(qq, function(e, result, fields){
								uvprocess=false;
								processVote();
							});
						} else {
							var qq='INSERT INTO uservote VALUES (\''+vote.id+'\', \''+vote.user.id+'\', \''+vote.v+'\', NULL)';
							db.connection.query(qq, function(e, result, fields){
								uvprocess=false;
								processUserVote();
							});
						}
					} else {
						console.log(e);
						uvprocess=false;
						processUserVote();
					}
				});
			} else {
				var q='DELETE FROM uservote WHERE uservote.userid = \''+vote.id+'\' AND uservote.voterid = \''+vote.user.id+'\' LIMIT 1';
				db.connection.query(q,function(error, result, fields){ 
					uvprocess=false;
					processUserVote();
				});
			}
		} else {
			uvprocess=false;
		}
	}

}
function processVote(){
	if (!vprocess){
		vprocess=true;
		if (voteq.length>0){
			var vote=voteq.pop();
			if (vote.v){
				var q='SELECT * FROM trackvote WHERE trackvote.trackid = \''+vote.id+'\' AND trackvote.voterid = \''+vote.user.id+'\'';
				db.connection.query(q, function(e, result, fields){
					if (!e){
						console.log(result);
						if (result.length>0){
							var qq='UPDATE trackvote SET value = \''+vote.v+'\' WHERE trackvote.trackid = \''+vote.id+'\' AND voterid = \''+vote.user.id+'\'';
							db.connection.query(qq, function(e, result, fields){
								vprocess=false;
								processVote();
							});
						} else {
							var qq='INSERT INTO trackvote VALUES (\''+vote.id+'\', \''+vote.user.id+'\', \''+vote.v+'\', NULL)';
							db.connection.query(qq, function(e, result, fields){

								vprocess=false;
								processVote();
							});
						}
					} else {
						vprocess=false;
						processVote();
					}
				});
			} else {
				var q='DELETE FROM trackvote WHERE trackvote.trackid = \''+vote.id+'\' AND trackvote.voterid = \''+vote.user.id+'\' LIMIT 1';
				db.connection.query(q,function(error, result, fields){ 
					vprocess=false;
					processVote();
				});
			}
		} else {
			vprocess=false;
		}
	}

}

exports.addVote=function (vote){
	voteq.push(vote);
	processVote();

}
exports.addUserVote=function (vote){
	uvoteq.push(vote);
	processUserVote();

}
exports.addTrack = function(track, callback){
	track.artist=track.artist/*.xss()*/;
	track.title=track.title/*.xss()*/;
	track.info=track.info/*.xss()*/;
	console.log('inserting');
	db.connection.query('INSERT INTO tracks VALUES (NULL, ?, ?, 0, ?, ?, ?, ?, ?, NOW(), NULL)',
		[track.path, 
		track.channel, 
		track.artist, 
		track.title, 
		track.time,
		track.submiter,
		track.info],
		function(err, result){
			console.log('errors:');
			console.log(err);
			console.log('result:');
			console.log(result);
			if (err){
				console.log(err);  	
			} else { 
				console.log(result);
				track.id=result.insertId;
				var ids=[];
				var tids=[];
				if (track.tags.length){
					var q='INSERT INTO tracktags (trackid, tagid) VALUES';
					for (var t in track.tags){
						if (t>0){
							q+=','
						}
						q+='('+track.id+','+track.tags[t].id+')';
					}
					console.log(q);
					db.connection.query(q, function(e, result, fields){
						console.log('error',e);
						callback();
					});
				} else {
					callback();
				}
			}
		}
	);
	
}
exports.setPlayDate = function (id, time){
	var q='UPDATE tracks SET playdate = DATE_SUB(NOW(), INTERVAL '+time+' SECOND) WHERE id ='+id;
	db.connection.query(q,function(error, result, fields){
			if (error){
				console.log(error);
			}
	});
}
exports.setGold = function (id, time){
	var q="UPDATE tracks SET gold = b'1' WHERE id ="+id;
	db.connection.query(q,function(error, result, fields){
		if (error){
			console.log(error);
		}
	});
}
exports.removeTrack = function (id, callback){
	var q='DELETE FROM tracks WHERE id in ('+id+')';
	db.connection.query(q,function(error, result, fields){
			if (error){
				console.log(error);
			} else {
				callback();
			}
	});
}
exports.getTracks = function(paths, callback){
	var ps='"'+paths.join('","')+'"';
	var q='SELECT tracks.*, users.name FROM tracks LEFT JOIN users ON tracks.submiter=users.id WHERE path in ('+ps+') and tracks.date BETWEEN NOW() - INTERVAL 12 HOUR AND NOW() order by tracks.date desc';
	db.connection.query(q,function(error, result, fields){ 
		if (!error){
			var ids='';
			for (var t in result){
				result[t].positive=[];
				result[t].negative=[];
				result[t].tags=[];
				result[t].rating=0;
				result[t].gold=result[t].gold[0]==1;
				var ar=result[t].path.split('/')
				result[t].path=ar[ar.length-1];
				ids+=result[t].id+',';
			}
			
			ids=ids.slice(0,-1);
			var tracks=result;
			var q='SELECT trackvote.*, users.name FROM trackvote LEFT JOIN users ON trackvote.voterid=users.id WHERE trackid in ('+ids+')';
			db.connection.query(q,function(error, result, fields){ 
				if (!error){
					for (var v in result){		
						for (var t in tracks){
							if (result[v].trackid==tracks[t].id){
								var vote={
										'voterid':result[v].voterid,
										'name':result[v].name,
										'value':result[v].value
									};
								if (result[v].value>0){
									tracks[t].positive.push(vote);
								} else {
									tracks[t].negative.push(vote);
								}
								tracks[t].rating+=result[v].value;
								break;
							}
						}	
					}
					var req='SELECT tracktags.trackid, tracktags.tagid, tags.name FROM tracktags LEFT JOIN tags ON tracktags.tagid=tags.id WHERE trackid in ('+ids+')';
					db.connection.query(req ,function(err, res, fields){ 
						if (!err){
							console.log('tags resived:');
							console.log(res);
							for (var v in res){		
								for (var t in tracks){
									var tag={
										'id':res[v].id,
										'n':res[v].name
									};
									if (res[v].trackid==tracks[t].id){
										tracks[t].tags.push(tag);
									}
								}
							}
							callback(tracks);	
						} else {
							console.log(err);
						}
					});
					
				} else {
					console.log(error);
				}
			});
		} else {
			console.log(error);
		}
	});
	
}

exports.getTags = function(string, callback){
	string=string/*.xss()*/;
	var q='SELECT * FROM tags WHERE name LIKE \'%'+string+'%\'';
	db.connection.query(q,function(error, result, fields){ 
		if (!error){
			var data={t:[]}
			for (var r in result){
				var res=result[r];
				data.t.push({id:res.id, n:res.name});
			}
			console.log(data.t);
			callback(data);
			
		} else {
			console.log(error);
			callback({error:'db fail'});
			
		}
	});
	
}

exports.getTag = function(string, callback){
	string=string/*.xss()*/;
	var q='SELECT * FROM tags WHERE name ="'+string+'"';
	db.connection.query(q,function(error, result, fields){ 
		console.log('from db - ', result);
		if (!error&&result.length>0){
			var data={};
			var res=result[0];
			data.t={id:res.id, n:res.name};
			console.log(data);
			callback(data);
		} else {
			console.log(error);
			callback({error:'db fail'});
			
		}
	});
	
}
exports.addTag = function(string, callback){
	string=string.toLowerCase()/*.xss()*/;
	console.log('tag from user - ', string);
	this.getTag(string, function(data){
		console.log('finded', data);
		if (data.t){
			callback({id:data.t.id, n:data.t.n});
		} else {
			var q='INSERT INTO `tags` (`id`, `name`) VALUES (null, \''+string+'\')';
			db.connection.query(q,function(error, result, fields){ 
				if (!error){
					console.log('new tag id '+result.insertId+' > '+string);
					callback({id:result.insertId, n:string});
				} else {
					console.log(error);
					callback({error:'db fail'});
				}
			});
		}
	});
}

exports.addTrackTag = function(track, tag, callback){
	console.log('adding tag to track');
	db.connection.query('INSERT INTO tracktags (trackid, tagid) VALUES ('+track.id+','+tag.id+')', function(e, result, fields){
		callback();
	});	
}


exports.sendinvite = function (code, mail, socket){
	console.log('sending mail - '+mail);
	exec('php /home/trigger/node/sendmail.php '+mail+' '+code, function(error, stdout, stderr){
		if(!error){
			db.connection.query('UPDATE invites SET  email="'+mail+'", send_time=NOW() WHERE  code = "'+code+'" LIMIT 1', function(error, result, fields){ 
				if (error){
					socket.emit('invitestatus',{ok:false, m:mail});
				} 
				if (result){
					socket.emit('invitestatus',{ok:true, m:mail});
				}
			});
		} else {
			socket.emit('invitestatus',{ok:false, m:mail});
		}
	});
}
exports.recoverpass = function(mail, callback){
	mail=mail/*.xss()*/;
	 db.connection.query('SELECT * FROM users WHERE email = \''+mail+'\'', function(err, result, fields){
    	if (!err){
	    	if (result[0]){
	    		var pass=md5("pass"+Math.random()*100000000000+new Date().getTime()+"a").substring(3, 9);
	    		var code=md5(pass);
	    		db.connection.query('UPDATE users SET  password="'+code+'" WHERE  email = "'+mail+'" LIMIT 1', function(error, r, fields){ 
					if (error){
						callback({ok:false, e:'db fail'});
					} 
					if (r){
						exec('php /home/trigger/node/sendpass.php '+result[0].email+' '+result[0].name+' '+ pass, function(error, stdout, stderr){
							if(!error){
								callback({ok:true, m:'Привет, '+ result[0].name+' на твой ящик '+ result[0].email+' отправлен новый пароль ;)'});
							} else {
								callback({ok:false, e:'sending mail fail'});
							}
						});
						
					}
				});
	    	} else {
		    	callback({ok:false, e:'no user'});
	    	}
    	} else {
	    	callback({ok:false, e:'db fail'});
    	}
    });

	
}
exports.changeuserpass = function(id, pass, callback){
	var newpass=pass/*.xss()*/;
	db.connection.query('UPDATE users SET password ="'+newpass+'" WHERE id = '+id, function(err, result, fields){
    	if (!err){
			callback({ok:true});
    	} else {
	    	callback({ok:false, e:err});
    	}
    });

	
}
exports.changeuserdata = function(user){
	var g=0;
	if (user.gender){
		g=1;
	} 
	db.connection.query('UPDATE users SET gender ='+g+' WHERE id = '+user.id, function(err, result, fields){
		console.log('update user data - ',err, result);
    });
}
exports.generateinvite = function (userid){
	var code=md5("sds"+Math.random()*100000000000+new Date().getTime()+"a");
	db.connection.query('insert into invites (parentid, code, give_time, userid) VALUES ('+userid+', "'+code+'", NOW(), 0)', function(error, result, fields){ 
		if (error){
			console.log('generation invite error-'+error);
		}
	});
}
	


