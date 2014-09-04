<html>
<head>
	<link type="text/css" href="assets/css/style.css" rel="stylesheet" media="screen">
	<link type="text/css" href="assets/css/bootstrap.min.css" rel="stylesheet" media="screen">
	<link type="text/css" href="assets/css/bootstrap-responsive.min.css" rel="stylesheet" media="screen">
	<link type="text/css" href="assets/css/style.min.css" rel="stylesheet" media="screen">
	<script src="http://code.jquery.com/jquery-latest.js"></script>
	<script src="assets/js/bootstrap.min.js"></script>
<title>
	You're lucky!
</title>
</head>
<body>
<header>
	<div class="nav navbar-fixed-top" style="background-color:#333;padding:12px 0px 6px 20px;">
		<img src="assets/img/triggerlogo.png"/>
		<span style="color:#FFCD00;padding-left: 90px;">You're almost there...</span>
	</div>
</header>
<div class="container">
<?php
date_default_timezone_set('Europe/Moscow');
require_once ('validation/validation.php'); 		// validation class
// mysqli classes
require_once('mysql_classes/class.simpleDB.php');
require_once('mysql_classes/class.simpleMysqli.php');
require_once('config.php');

$rules = array(); // validation rules array

// rules
$rules[] = 'required,email,email is required';
$rules[] = 'required,code,invites is required';

$rules[] = 'valid_email,email,non-valid email format';

$rules[] = 'length=32,code,non-valid invite format';
$rules[] = 'is_alpha,code,non-valid invite format';

$errors = validateFields($_GET, $rules);

// if there were errors, show errors
if (!empty($errors)) {
    $fields = $_GET;
    echo '<div class="span8">';
    foreach ($errors as $_error_value) {
    	echo '<div class="alert alert-error">'.$_error_value.'</div>';
    }
    echo '</div>';
}

// no errors! show the from or whatever
else { ?>
	
	<?php	$db = new simpleMysqli($__mysql_config); // new mysqli instance w/config from config.php
	$_get_invite = $db->select('SELECT email, userid FROM trigger.invites WHERE code=?', $_GET['code']); // get the data from db
	
	$_check = TRUE;
	if ($_get_invite) { // if data avalaible
		foreach ($_get_invite as $_value) {
			$db_email = $_value['email'];
			$db_userid = $_value['userid'];
		}	
	} else {
		echo '<div class="alert alert-error">'.'something wrong. please check your email/inbox/etc.'.'</div>';
		$_check = FALSE;
	}

	if ($db_email !== $_GET['email']) {
		echo '<div class="alert-error alert">'.'something wrong. sure you are use the correct email?'.'</div>';
		$_check = FALSE;
	}
	if ($db_userid !== 0) {
		echo '<div class="alert-info alert">'.'oh man. this invite is already in use.'.'</div>';
		$_check = FALSE;
	}

	if ($_check == TRUE) {
		echo '<div class="container span6" id="login">';
			echo '<h1>Okay. You\'re ready to join us.</h1>';
			echo '<form action="" method="post" id="Create" accept-charset="utf-8" class="well span4" style="background-color: #fefefe;">'; ?>
			<div class="control-group">
				<div class="input-prepend">
					<span class="add-on">
						<i class="icon-user"></i>
					</span>
					<input type="text" id="username" name="username" value="" placeholder="Username" style="height: 30px;" maxlength="15"> 
				</div>
 			</div>
 			<div class="control-group">
				<div class="input-prepend">
					<span class="add-on">
						<i class="icon-envelope"></i>
				</span>
					<input type="text" id="focus" name="email" placeholder="Email" value="<?php echo $_GET['email'] ?>" style="height: 30px;" maxlength="24">
				</div>
			</div>
			<div class="control-group">
				<div class="input-prepend">
					<span class="add-on">
						<i class="icon-lock"></i>
					</span>
					<input type="password" id="password" name="password" placeholder="Password" style="height: 30px;" maxlength="15">
				</div>
			</div>
			<div class="control-group">
				<div class="input-prepend">
					<span class="add-on">
						<i class="icon-bookmark"></i>
					</span>
					<input type="text" id="code" name="code" value="<?php echo $_GET['code'] ?>" style="height: 30px;" maxlength="32">
				</div>
			</div>
			<input type="submit" name="Create" value="Sign" class="btn btn-inverse">
			</form>
		<?php echo '</div>';
	}
}

?>
<script>
 $(document).ready(function(){
 });
</script>
</div>

<?php
$action = $_POST;
if ($action && $_check === TRUE) {
	$_get_name = $db->select('SELECT name,email FROM trigger.users WHERE name=? OR email=?', $action['username'], $action['email']); // get the username from db
	$_get_invite = $db->select('SELECT email, userid FROM trigger.invites WHERE code=?', $action['code']); // get the data from db

	$rules[] = 'length=1-15,username,incorrect username length.';
	$rules[] = 'is_alpha,username,incorrect username format. only enter an alphanumeric (0-9 a-Z) string.';
	$rules[] = 'length=1-15,password,incorrect password length.';
	$rules[] = "reg_exp,^[-\pL\pN_]++$,i,incorrect password format.";
	$errors = validateFields($action, $rules);
	
	foreach ($_get_name as $_value) {
		if ($_value['name'] === $action['username'] || $_value['email'] === $action['email']) {
			$errors[] = 'username and email must be unique';
		}
	}

	if ($_get_invite) { // if data avalaible
		foreach ($_get_invite as $_value) {
			$db_email = $_value['email'];
			$db_userid = $_value['userid'];
		}	
	}

	if ($db_email !== $action['email']) {
		$errors[] = 'something wrong. sure you are use the correct email?';
	}

// if there were errors, show errors
	if (!empty($errors)) {
    	$fields = $_POST;
    	echo '<div class="span4 offset2">';
    	foreach ($errors as $_error_value) {
    		echo '<div class="alert alert-error">'.$_error_value.'</div>';
    	}
    	echo '</div>';
	} else {
		$_now = date('Y-m-d H:i:s');
		$_insert_new = $db->insert('INSERT INTO users (name,password,email,gender,country,city) VALUES(?,?,?,?,?,?)', $action['username'], md5($action['password']), $action['email'],1,'Wonderland', 'Wonderland');
		$new_userid = $db->queryInfo['insert_id'];
		 $_update_invites = $db->update('UPDATE invites SET userid=?, activated_time=?, email=? WHERE code=?', $new_userid, $_now, $action['email'], $action['code']);
		setcookie('login', $action['username'],time()+2592000,'/','trigger.fm');
		setcookie('password', $action['password'],time()+2592000,'/','trigger.fm');
		header('Location: http://trigger.fm');
	}

} 
?>
</body>
</html>