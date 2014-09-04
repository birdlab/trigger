
var md5 = require('MD5');
var mysql = require('mysql');

var connection = mysql.createConnection({

  host     : 'localhost',
  user     : 'root',
  password : '***REMOVED***',
  database : 'trigger'
});

connection.connect();

var files;
var counter=0;
var totaltime=0;
reguser ({
	'name':'toymihay',
	'pass':'111'
});


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
		    connection.query('UPDATE users SET password="'+password+'" WHERE name="'+username+'"',function(error, result, fields){ 
				if (error){
					throw error;
				} 
				if (result){
					var user={
						'username':username,
						'dbid':result.insertId,
						'rating':0
					};	
					console.log('Ура! Триггер обновил пароль пользователя!');
					console.log ('юзернейм: '+user.username);
					console.log ('пароль: '+data.pass);		
				}
			});
		} else {
		   	console.log('try to reg');
		    console.log(data);
		    
		    
			connection.query('UPDATE users VALUES (NULL, \''+username+'\', \''+password+'\', \''+mail+'\', NULL, \''+0+'\', \'NoData\', \'NoData\')',function(error, result, fields){ 
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
