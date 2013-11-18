var db=require('./dbdata.js');
var main = require('../trigger.js');
var rootsockets=require('./sockets.js');

function User()
{
     this.sockets=[];
     this.rating=null;
     this.gender=null;
     this.positive=[];
     this.negative=[];
     this.votes=0;
     this.weight=0;
     this.time=0;
     this.name=null;
     this.id=null;
     this.city='';
     this.country='';
     this.regdate=null;
     this.pass=null;
     this.email=null;
     this.virtual=false;
     this.nextUpdate=0;
}

User.prototype.init = function(data) {
	var user=this;
	for (var s in data){
		if (s!='votes'){
			this[s]=data[s];
		} else {
			var votes=data[s], sum=0;
			for (var v in votes){
				sum+=votes[v].value;
				if (votes[v].value>0){
					user.positive.push(votes[v]);
				} else {
					user.negative.push(votes[v]);
				}
			}
			user.rating=sum;
			user.weight=Math.floor(user.rating/10)+1;
		}
	}
}

User.prototype.updateLimits = function(callback) {
	var user=this;
	db.updatelimits(this.id, function(data){
		user.time=user.rating*120+1200-data.time;
		user.nextUpdate=data.next;
		if (data.next>0){
			setTimeout(function(){user.updateLimits();}, user.nextUpdate);
		}
		if (callback){
			callback();
		} else {
			rootsockets.updateLimits(user);
		}
	});
}


User.prototype.fastinfo = function() {
		return {
			'n':this.name,
			'id':this.id,
			't':this.time,
			'w':this.weight,
			'nt':this.nextUpdate
		};
	
}
User.prototype.fullinfo = function(self, callback) {
	var user=this;
	var data = {
		'id':user.id,
		'g':user.gender,
		'name':user.name,
		'ci':user.city,
		'co':user.country,
		'reg':user.regdate,
		'r':user.rating,
		'n':[],
		'p':[]
	};	
	var positive=user.positive;
	var	negative=user.negative;
		
	for (var i in positive){
		data.p.push({
			v:positive[i].value,
			vid:positive[i].voterid,
			n:positive[i].name	
		});
	}
	for (var i in negative){
		data.n.push({
			v:negative[i].value,
			vid:negative[i].voterid,
			n:negative[i].name	
		});
}
	if (self){
		data.t=this.time;
		data.v=this.votes;
	}
	db.getInvites(user.id, function(invites){
		if (!self){
			data.invites={u:invites.u, p:invites.p};
		} else {
			data.invites=invites;
		}
		db.getstats(user.id, function(stats){
			data.trx=stats.trx;
			data.rt=stats.rt;
			callback(data);
		});		
		;
	});
	
	
}
User.prototype.addSocket = function(socket) {
	var sockets=this.sockets;
	var is=false;
	for (var s in sockets){
		if (socket==sockets[s]){
			is=true;
			break;
		}
	}
	if (!is){
		sockets.push(socket);
	} 
	this.updateLimits();
}
User.prototype.delSocket = function(socket) {
	var sockets=this.sockets;
	var user=this;
	for (var s in sockets){
		if (socket==sockets[s]){
			console.log('socket '+socket+' as '+this.name+' quit');
			sockets.splice(s,1);
			if (!sockets.length>0){
				console.log(user.name, 'sockets', user.sockets);
				setTimeout(function(){
					for (var u in main.users){
						if (user==main.users[u]&&!sockets.length>0){
							console.log('deleting user '+user.name);
							main.users.splice(u,1);
							console.log(main.users.length+' users online');
							break;
						}
					}
				}, 5000);
			}
			break;
		}
	}
}


exports.newUser = function(data) {
	var u=new User();
	u.init(data);
	return u;
};