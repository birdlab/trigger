function AppCtrl($scope, socket) {
	
	var version = 2040;
	var defaultChannel = 1;

	$scope.model = {};

	$scope.model.activeTab = 'channels';

	
//--------------------Обработчики---------------------------------

var onGetVerHandler = function(data){
	socket.emit('ver', {'v': version, 'init':true}, function(data){console.log('emit ver callback, data: ', data)});
};

var onWelcomeHandler = function(data){
	console.log(data);
	$scope.model.channels = data.channels;
	tryStoredLogin();
};

var onLoginStatusHandler = function(data){
	var userData = {};
	if(data.error){
		if (data.error=='nouser'){
			userData.error='Нет такого пользователя';
		}
		if (data.error=='wrongpass'){
			userData.error='Не тот пароль';
		}
	} else {
		userData.user=data.user;
		if (userData.user.t < 0){
			userData.user.t=0;	
		}
		userData.user.nt = new Date(Date.parse(new Date())+ userData.user.nt);
	}
	$scope.model.user = userData;

	restoreChannel();		
};

var onChannelDataHandler = function(data){
	console.log(data);
	$scope.model.activeTab = 'chat';
	$scope.model.activeChannelId = data.id;
};

var onChatDataHandler = function(data){
	$scope.model.chatMessages = data.m;
};

var dummyHandler = function(data){
	console.log(data);
};


//--------------------Конец обработчиков--------------------------
var tryStoredLogin = function(){
	var user=$.Storage.get("username");
	var pass=$.Storage.get("password");
	if (user&&pass){
		$scope.login(user, pass, loginCallback);
	}
};

$scope.login = function(user, pass){
	console.log('$scope.login', user, pass);
	socket.emit('login', {u:user, p:pass});
};

var restoreChannel = function(){
	var storedChannel = $.Storage.get("channel");
	if(storedChannel){
		$scope.goToChannel(storedChannel);
	}
	else{
		$scope.goToChannel(defaultChannel);
	}
};

$scope.goToChannel = function(channelId){
	console.log('goToChannel', channelId);
	$scope.model.activeChannelId = channelId;
	socket.emit('gochannel', {id:channelId}, goToChannelCallback);
	socket.emit('getchat',{'shift': 0, 'id' : $scope.model.activeChannelId}, function(data){
			console.log(data);
		});
};

$scope.switchTab = function(tab){
	$scope.model.activeTab = tab;
	if(!$scope.model.messages || $scope.model.messages.length == 0){
		
	}
};


var loginCallback = function(data){
	console.log('loginCallback', data);
};

var goToChannelCallback = function(data){
	console.log('goToChannelCallback', data);
};



var handlers = [];
handlers.push({eventName: 'getver', handler: onGetVerHandler});
handlers.push({eventName: 'welcome', handler: onWelcomeHandler});
handlers.push({eventName: 'loginstatus', handler: onLoginStatusHandler});
handlers.push({eventName: 'channeldata', handler: onChannelDataHandler});
handlers.push({eventName: 'chatdata', handler: onChatDataHandler});
handlers.push({eventName: 'addtrack', handler: dummyHandler});
handlers.push({eventName: 'removetrack', handler: dummyHandler});
handlers.push({eventName: 'newcurrent', handler: dummyHandler});
handlers.push({eventName: 'lst', handler: dummyHandler});
handlers.push({eventName: 'usupd', handler: dummyHandler});
handlers.push({eventName: 'uplim', handler: dummyHandler});
handlers.push({eventName: 'message', handler: dummyHandler});
handlers.push({eventName: 'history', handler: dummyHandler});
handlers.push({eventName: 'channelsdata', handler: dummyHandler});
handlers.push({eventName: 'userdata', handler: dummyHandler});
handlers.push({eventName: 'uvd', handler: dummyHandler});
handlers.push({eventName: 'invitestatus', handler: dummyHandler});
handlers.push({eventName: 'logoutok', handler: dummyHandler});
handlers.push({eventName: 'recoverstatus', handler: dummyHandler});
handlers.push({eventName: 'changepass', handler: dummyHandler});
handlers.push({eventName: 'newuser', handler: dummyHandler});
handlers.push({eventName: 'offuser', handler: dummyHandler});
handlers.push({eventName: 'playlist', handler: dummyHandler});
handlers.push({eventName: 'loginstatus', handler: dummyHandler});
handlers.push({eventName: 'disconnect', handler: dummyHandler});
handlers.push({eventName: 'trackstatus', handler: dummyHandler});
handlers.push({eventName: 'tags', handler: dummyHandler});
handlers.push({eventName: 'uptr', handler: dummyHandler});

var bindHandlers = function(){
	while(handlers.length > 0){
		var e = handlers.pop();
		if(e){
			socket.on(e.eventName, e.handler);
		}
	}
};

bindHandlers();

}