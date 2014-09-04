var md5 = require('MD5');
var mysql = require('mysql');
var sys = require("sys");
var exec = require("child_process").exec;

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '***REMOVED***',
  database : 'trigger'
});

connection.connect();

addinvite(1);

//getinvites(1);

var files=[];
var p=0;
function addinvite(userid, mail){
	var code=md5("sds"+Math.random()*100000000000+"a");
	console.log(code);
	connection.query('insert into invites (parentid, code, give_time, userid) VALUES ('+userid+', "'+code+'", NOW(), 0)',function(error, result, fields){ 
		if (error){
			throw error;
		} 
		if (result){
			console.log(result);
			//sendinvite(code, 'mail@birdlab.ru');
		}
	});	
}

function getinvites(userid){
	var query='SELECT * FROM invites WHERE parentid = '+userid;
	connection.query(query,function(error, result, fields){ 
		if (error){
			throw error;
		} 
		if (result){
			console.log(result);
		}
	});
}

function sendinvite(code, mail){
	console.log('sending mail - '+mail);
	exec('php /home/trigger/node/sendmail.php '+mail+' '+code, function(error, stdout, stderr){
		if(!error){
			connection.query('UPDATE invites SET  email="'+mail+'", send_time=NOW() WHERE  code = "'+code+'" LIMIT 1', function(error, result, fields){ 
				if (error){
					console.log(error);
				} 
				if (result){
					console.log(result);
				}
			});
		} else {
			console.log(error);
		}
	});
}

function reguser(data){
    var username=data.name;
    var password=md5(data.pass);
    var mail=data.email;    	
    var query='SELECT * FROM users WHERE name = \''+username+'\' OR email = \''+mail+'\'';
    connection.query(query, function(error, result, fields){
	    if (error){
		    throw error;
		}
		if (result[0]){
		    console.log(result[0]);
		} else {
		   	console.log('try to reg');
		    console.log(data);
		    var q=''
		    
		    
			connection.query('INSERT INTO users VALUES (NULL, \''+username+'\', \''+password+'\', \''+mail+'\', NULL, \''+0+'\', \'NoData\', \'NoData\')',function(error, result, fields){ 
				if (error){
					throw error;
				} 
				if (result){
					var user={
						'username':username,
						'dbid':result.insertId,
						'rating':0
					};	
					console.log('Ура! Триггер добавил нового пользователя!');
					console.log ('почта: '+mail);
					console.log ('юзернейм: '+user.username);
					console.log ('пароль: '+data.pass);		
				}
			});
		}
	});
}
