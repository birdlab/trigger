var mysql = require('mysql');

exports.connection = mysql.createConnection({
  host     : '', 	/* i.e. 'localhost' */
  user     : '', 	/* i.e. 'root' */
  password : '', 	/* mysql password */
  database : ''  	/* i.e. 'trigger' */
});


