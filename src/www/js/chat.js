var customCodes=[];

    customCodes[0]=[];
	customCodes[0][0]=/(http:\/\/[\w\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?(?:[\w])+\.(?:jpg|png|gif|jpeg|bmp))/gim;
	customCodes[0][1]='<a href="$1" target="_blank"><img src="$1" /></a>';
	
	customCodes[1]=[];
	customCodes[1][0]=/(https:\/\/[\w\-\.]+\.[a-zA-Z]{2,3}(?:\/\S*)?(?:[\w])+\.(?:jpg|png|gif|jpeg|bmp))/gim;
	customCodes[1][1]='<a href="$1" target="_blank"><img src="$1" /></a>';
	
    customCodes[2]=[];
	customCodes[2][0]=/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	customCodes[2][1]='<a href="$1" target="_blank">$1</a>';
	
    customCodes[3]=[];
	customCodes[3][0]=/(^|[^\/])(www\.[\S]+(\b|$))/gim;
	customCodes[3][1]='<a href="http://$1" target="_blank">$1</a>';
	
    customCodes[4]=[];
	customCodes[4][0]=/([\w\-\d]+\@[\w\-\d]+\.[\w\-\d]+)/gim;
	customCodes[4][1]='<a href="mailto:$1">$1</a>';
	
    customCodes[5]=[];
	customCodes[5][0]='!!!!!!!!!!';
	customCodes[5][1]='я идиот убейте меня кто нибудь! ';
	
    customCodes[6]=[];
	customCodes[6][0]='))))))))))';
	customCodes[6][1]='<font color="pink">недавно я познакомился с мальчиком, у него такие голубе глаза и член который... кажется я не туда пишу</font> ';
	
    customCodes[7]=[];
	customCodes[7][0]='NO.';
	customCodes[7][1]='<img src="http://a0.twimg.com/profile_images/2220522408/no-meme-rage-face_reasonably_small.jpg" />';


var messages=[];
var now=null;

function playTink(){
	var sound = new Audio();
	if (sound.canPlayType('audio/ogg')){
		sound.src='http://birdlab.ru/trigger/tink.ogg';
		sound.play();
	} else {
		sound.src='http://birdlab.ru/trigger/tink.mp3';
		sound.play();
	}
}  
function fillUserlist(){
	$('#info .users .topline').html('<span>Здесь:'+client.chat.u.length+'</span>');
	$('#info .users .scroller').html('');
	mutelist=[];
	for (var us in client.chat.u){
		var user=client.chat.u[us];
		var block=$('<div class="userblock"><span class="info">i</span><a href="javascript:addNick(\''+user.n+'\');void(0);">'+user.n+'</a></div>').prependTo($('#info .scroller'));		
		if (user.a){
			block.addClass('active');
		}
		block.attr('userid', user.id);
		block.children('span.info').attr('userid', user.id);
		block.children('span.info').click(function(){
			getuser(parseInt($(this).attr('userid')));
		});
		
		var muted=$.Storage.get("muteuser"+user.id);
		if (muted){
			block.children('span.info').css('background-color','#cccccc');
			mutelist.push(user.id);
		}
		
	}
}

function refreshuser(data){
	$("#info .users .scroller .userblock").each(function(index) {
		if ($(this).attr('userid')==data.uid){
			if (data.a){
				$(this).addClass('active');
			} else {
				$(this).removeClass('active');
			}
		}
  	});
	
	
}

function addTr(id){
	var text = $('#messageinput').val()
	if (text.replace('/track'+id,'')==text){
		$('#messageinput').val(text+'/track'+id+' ');
	} 
	var to=$('#messageinput').val().length;
	$('#messageinput').selectRange(to,to);
    return false;
}

function addNick(name){
	var text = $('#messageinput').val()
	if (text.replace('>'+name,'')==text){
		$('#messageinput').val('>'+name+' '+text);
	} 
	var to=$('#messageinput').val().length;
	$('#messageinput').selectRange(to,to);
    return false;
}
var meta=[];
meta[0]=/\/track(\w*)/gim;

function addMessage(md) {
		for (var i in mutelist){
			if (mutelist[i]==md.uid){
				console.log('user '+md.uid+' as '+md.uname+' muted');
				return;
			}
		}
		if (md.m.replace('>'+client.user.n,'')!=md.m){
			if (tink){playTink();}
			md.m='<b style="color:black">>'+client.user.n+md.m.replace('>'+client.user.n,'')+'</b>';
		}
		meta[0]=/\/track(\w*)/gim;
		for (var i in meta){
			var res=meta[i].exec(md.m);
			if (res){
				var str='';
				if (i==0){
					var tr=client.track(parseInt(res[1]));
					str='<a href="javascript:opentrack('+tr.id+');void(0);">'+tr.a+' - '+tr.t+'</a>';
				}
				md.m = md.m.replace(res[0], str);
			}
		}
		var message=$('<div class="message '+md.uname+'"><table><tr><td class="names"><span onclick="return addNick(\''+md.uname+'\')" >'+md.uname+': </span></td><td class="sms">'+md.m+'</td><td class="mif"><div class="messageinfo"></div></td></tr></table></div>')
		message.time=new Date(md.t).getTime();
		if (messages.length){
			if (message.time>messages[0].time){
				message.appendTo($('#chatmessages'));
				messages.push(message);
			} else {
				message.prependTo($('#chatmessages'));
			}
		} else {
			message.appendTo($('#chatmessages'));
			messages.push(message);
		}
		if (noimg){
			message.find("img").css('display', 'none').after('<span class="pc">картинка</span>');
		}
		now=new Date().getTime();
		upadateMT(message);
}

function upadateMT(message){		
	var delta=now-message.time;
	var timediv=$(message).find('.messageinfo');
	if (delta<5000){
		
		timediv.html('только что');
	}
	if (delta>5000&&delta<60000){
		timediv.html(Math.round((now-message.time)/1000)+' секунд назад');
	}
	if (delta>60000&&delta<1800000){
		var tm=Math.round((now-message.time)/60000);
		var str=tm.toString();
		var ttm=parseInt(str[length-1]);
		var mes=' минут назад';
		if (tm<2){
			tm='';
			mes=' минуту назад';
		}
		if (tm>1&&tm<5){
			mes=' минуты назад';
		}
		timediv.html(tm+mes);
	}
	if (delta>1800000&&delta<3600000){
		timediv.html('полчаса назад');
	}
	if (delta>3600000&&delta<7200000){
		timediv.html('час назад');
	}
	if (delta>7200000){
		if (delta<10800000){
			timediv.html(Math.round((now-message.time)/3600000)+' часа назад');
		} else {
			timediv.html(Math.round((now-message.time)/3600000)+' часов назад');
		}
	}
}