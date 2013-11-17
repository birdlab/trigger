(function($){ $.fn.autofocus=function(){return (this[0].autofocus!==true)?this.focus():this;};})(jQuery);


var client=null,
	remember_name=true;
	tink=true;
	noimg=false;
	historyprocess=false;
	lht=0;
	recovery=false;
	mutelist=[];
var ctrl=false;

	
$(document).ready(function() {

	jQuery.easing.def = "easeOutExpo";
	player=new Player();
	
	var t=$.Storage.get("tink");
	if (t){
		if (t=='false'){
			tink=false;
		} else {
			tink=true;
		}
	} else {
		$.Storage.set("tink", 'true');
	}
	var ni=$.Storage.get("noimg");
	if (ni){
		if (ni=='false'){
			noimg=false;
		} else {
			noimg=true;
		}
	} else {
		$.Storage.set("noimg", 'false');
	}
	client=new Client();
	$(client).bind('welcome',function(event,data){
		if (data){
			showChannels(data); 
			var user=$.Storage.get("username"), pass=$.Storage.get("password");
			if (user&&pass){
				client.login(user, pass, processLogin);
			} else {
				var ch=$.Storage.get("channel");
				if (ch){
					client.goChannel(parseInt(ch), onChannel);
				} else{
					client.goChannel(1, onChannel);
				}
			}
			
		} else {
			
		}
		
	});
	$(client).bind('disconnect',function(event,data){
			$('.content').hide();
			$('.submit_box').hide();
			$('.loginform').show();
			$('#info .tabs .chat').hide();
			$('.loginform .alert').html('потеряно соединение с сервером');
			$('#console .upfiles').hide();
			player.stop();
			$('#console .streamcontrol .stop').hide();
			$('#console .streamcontrol .play').show();
			
	});
	
	$(client).bind('message',function(event,data){
		var move=false;	
		if ($('.log')[0].scrollHeight - $('.log').scrollTop() == $('.log').outerHeight()) {
			move=true;
		}
		addMessage(data);
		if (move){
			$('.log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
		}
	});
	
	$(client).bind('cover',function(event,data){
		if (data.src!='img/nocover.png'){
			if ($('#playlist .current').attr('trackid')==data.id){
				$('#playlist .current .artwork').html('<img src="'+data.src+'">');
			} else {
				$('.trackid'+data.id+' .artwork').html('<img src="'+data.src+'">');
			}
		}
	});
	$(client).bind('addtrack',function(event,data){
		var move=false;	
		if ($('.log')[0].scrollHeight - $('.log').scrollTop() == $('.log').outerHeight()) {
			move=true;
		}
		
		$('<div class="message"><p><a href="javascript:addNick(\''+data.track.s+'\');void(0);">'+data.track.s+'</a>'+' прнс <a href="javascript:opentrack('+data.track.id+');void(0);">'+data.track.a+' - '+data.track.t+'</a></p></div>').appendTo($('#chatmessages'));
		if (move){
			$('.log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
		}
		addtrack(data.track);
	});
	$(client).bind('removetrack',function(event,data){
		removetrack(data.track.id);
	});
	$(client).bind('newuser',function(event,data){
		fillUserlist();
	});
	
	$(client).bind('listners',function(event,data){
		$('#info .content.channels #'+data.chid+' .listners').html('<span>Слушают:</span>'+data.l);
		if (data.chid==client.channel.chid){
			$('#console .info .chdata').html('<span>Слушают: </span>'+data.l+'<span> из них активно: </span>'+data.a);
		}
		if ($('.content.channels').hasClass('active')){
			fillchannelsdata(client.channels);
		}

	});
	
	$(client).bind('offuser',function(event,data){
		fillUserlist();
	});
	$(client).bind('updatelimits',function(event,data){
		newTagline();
	});
	$(client).bind('newcurrent',function(event,data){
		if (data.chid==client.channel.chid){
			setCurrent(data.track);
			setcurtime(true);
		}
		
		$('#info .content.channels #'+data.chid+' .current').html('<div class="cap">Сейчас:</div><div class="artist">'+data.track.a+'</div><div class="title">'+data.track.t+'</div>');
	});
	$(client).bind('trackupdate',function(event,data){
		if (data.current){
			data.t.current=true;	
		}
		updateTrack(data.t);
	});
	$(client).bind('userupdate',function(event,data){
		refreshuser(data);
	});
	setInterval(function(){
		var avalible=client.channel.current;
		if (avalible){
			client.channel.ct+=1;
			if (client.channel.ct>client.channel.current.tt){
				client.channel.ct=client.channel.current.tt;
			}
			setcurtime();
			updatetimes();
		}
	}, 1000);
	
	
	
	client.init(location.host);
	
	$("#remember").change(function() {
		var $input = $(this);
		remember_name=$input.is(':checked');
	});
	
	$('#console .loginform .button').click(goLogin);
	$('#lgpass').bind('keyup',function(e){
		if (e.keyCode==13){
			goLogin();
		}
	});
	
	$('#fileupload').fileupload({
        dataType: 'json',
        add: function (e, data) {
        	$.each(data.files, function (index, file) {
        		if (client.user){
               		addupload(file);
               	}
            });
        }
    });
    $('#info .tab').bind('mouseenter mouseleave', function() {
    	if (!$(this).hasClass('active')){
	    	$(this).children('a').toggleClass('hover');
	    }
	});
	$('#info .tabs .tab').bind('click', function() {
    	if (!$(this).hasClass('active')){
    		$('#info .tabs .tab').removeClass('active').children('a').removeClass('hover');
    		$(this).addClass('active').children('a').addClass('hover');
    		$('#info .content').hide();
    		if ($(this).hasClass('chat')){
	    		$('.content.chat').show();
	    		fillChat();
	    		onresize();
    		}
    		if ($(this).hasClass('channels')){
	    		showChannels();
    		}
    		if ($(this).hasClass('history')){
    			$('.content.history').show();
	    		showHistory();
    		}
    		if ($(this).hasClass('profile')){
    			$('.content.profile').show();
    			if (client.user){
    				getuser(client.user.id);
    			}
    		}
	    }
	});
	$('#info .tabs .chat').hide();
	$('#info .tabs .profile').hide();
	
	setInterval(newTagline, 90000);

	 $('#messageinput').bind("keyup", function(event){
		  if(event.keyCode == 13){
		  	var command=false;
		  	var m= $('#messageinput').val();
		  	if (m.replace('/tink', '')!=m){
		  		command=true;
		  		tink=!tink;
		  		settink();
			  	$('#messageinput').val($('#messageinput').val().match(/^(\>[a-zA-Z0-9_.]+ )+/g) || '');
		  	} 
		  	if (m.replace('/noimg', '')!=m){
		  		command=true;
		  		noimg=!noimg;
		  		setnoimg();
		  		$('#messageinput').val($('#messageinput').val().match(/^(\>[a-zA-Z0-9_.]+ )+/g) || '');
		  	} 
		  	if (!command) {
				for (var i=0; i<customCodes.length; i++){
					 if (m.replace(customCodes[i][0],'')!=m){
						m = m.replace(customCodes[i][0], customCodes[i][1]);
						if (i<2){
							break;
						}
					}
				}
				
				client.sendMessage(m);
				$('#messageinput').val($('#messageinput').val().match(/^(\>[a-zA-Z0-9_.]+ )+/g) || '');
			}
		  }
	 });
	 
	 $('#info .content.history .inner').scroll(function () {
		 if ($(this).children('.list').height()-$(this).scrollTop()-$(this).height()<300&&!historyprocess){
			 historyprocess=true;  
			 client.getHistory(lht, function(data){
				for (var t in data){
					addhistory(data[t]);
				}
				historyprocess=false;
			});
		 }

		});

	
	$('#console .streamcontrol .stop').hide();
	$('.content').hide();
    $('.submit_box').hide();
    $('#recovery').html('<a href="javascript:recoverymode(true); void(0);">Я забыл пароль</a>');
});

function recoverymode(b){
	recovery=b;
	if (recovery){
		$('#console .loginform .button').html('<a href="javascript:void(0);">Вспомнить</a>');
		$('#recovery').html('<a href="javascript:recoverymode(false); void(0);">Я вспомнил!</a>');
		$('#lgpass').hide();
		$('#save').hide();
		$('#lgname').attr('placeholder', 'Почта');
		$('.loginform .alert').html('Введи адрес ящика на который приходил инвайт');
	} else {
		$('#console .loginform .button').html('<a href="javascript:void(0);">Вход</a>');
		
		$('#recovery').html('<a href="javascript:recoverymode(true); void(0);">Я забыл пароль</a>');
		$('#lgpass').show();
		$('#lgname').attr('placeholder', 'Юзернейм');
		$('#save').show();
		$('.loginform .alert').html('');
	}
	
}

function settink(){
	if (tink){
		$.Storage.set("tink", 'true');
		$('<div class="message"><p>Теперь будет тинькать!</p></div>').appendTo($('#chatmessages'));
	} else {
		$.Storage.set("tink", 'false');
		$('<div class="message"><p>Больше не будет тинькать!</p></div>').appendTo($('#chatmessages'));
	}
	$('#info .content.chat .log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
}

function setnoimg(){
	if (noimg){
		$.Storage.set("noimg", 'true');
		$('#info .log').find("img").css('display', 'none').after('<span class="pc">картинка</span>');
	} else {
		$.Storage.set("noimg", 'false');
		$('#info .log').find("img").css('display', '');
		$('#info .log .pc').remove();
	}
	$('#info .content.chat .log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
}
function verbalTime(delta){
	if (delta<1){
		return false;
	}
	if (delta<60000){
		return 'несколько секунд';
	}
	if (delta>60000&&delta<1800000){
		var tm=Math.round(delta/60000);
		var str=tm.toString();
		var ttm=parseInt(str[length-1]);
		var mes=' минут';
		if (tm<2){
			tm='';
			mes=' минуту';
		}
		if (tm>1&&tm<5){
			mes=' минуты';
		}
		return tm+mes;
	}
	if (delta>1800000&&delta<3600000){
		return 'полчаса';
	}
	if (delta>3600000&&delta<7200000){
		return 'час';
	}
	if (delta>7200000){
		if (delta<10800000){
			return Math.round(delta/3600000)+' часа';
		} else {
			return Math.round(delta/3600000)+' часов';
		}
	}
}
function newTagline(){
	if (client.user&&origins.length>0){
		var username='<a href="javascript:getuser('+client.user.id+');void(0);">'+client.user.n+'</a>';
		var co=origins[Math.floor(Math.random()*origins.length)].replace('username',username)+'<br />';
		$('#console .userinfo').html(co);
		var tl=new Date(client.user.t*1000);
		var limit=tl.toUTCString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
		$('#console .userinfo').prepend('<div id="limits">Ты можешь залить '+limit+'</div>');
		$('#limits').hover(function(){
										var verbal=verbalTime(Date.parse(client.user.nt)-Date.parse(new Date()));
										if (!verbal){
											$(this).append('<span>За последние 12 часов не было ни одного трека от тебя</span>');	
										} else {
											$(this).append('<span>Cледущее обновление через '+ verbalTime(Date.parse(client.user.nt)-Date.parse(new Date()))+'</span>');
										}
									},
						function(){
										$(this).html('Ты можешь залить '+limit);
							});
	}
}

function fillChat(){
	client.getChat({},function(d){
		$('#chatmessages').html('');
		fillUserlist();
		for (var m in d.m){
			var data=d.m[m];
			addMessage(data);
		}
		
		$('#messageinput').autofocus();
		$('.log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
	});
}

function fillchannelsdata(d){
	var sorting=function(a,b){
		if (a.lst){
			var dif=b.lst-a.lst;
			if (dif!=0){
				return dif;
			} else {
				return a.id-b.id;
			}
		} else {
			return a.id-b.id;	
		}
	}
	var dc=$('.content.channels').html('').show();
	if (d.channels.length>0){
		if (d.channels[0].lst){
			d.channels.sort(sorting);	
		}
		for (var c in d.channels){
			var cd=d.channels[c];
			var chd=$('<div class="channel"><div class="name">'+cd.name+'</div><a href="'+streampath+cd.hi+'" target="_blank">192kbps</a> <a href="'+streampath+cd.low+'" target="_blank">96kbps</a><div class="listners"><span>Слушают:</span>'+cd.lst+'</div><br /></div>').appendTo(dc);
			if (cd.current){
				var current=$('<div class="current"><div class="cap">Сейчас:</div><div class="artist">'+cd.current.a+'</div><div class="title">'+cd.current.t+'</div></div>').appendTo(chd);
			}
			var users=$('<div class="users"></div>').appendTo(chd);
			for (var u in cd.users){
				var instring='<span><a href="javascript:getuser('+cd.users[u].id+');void(0);">'+cd.users[u].n+'</a> </span>'
				var us=$(instring).appendTo(chd);
			}
			chd.attr('id', cd.id);
			chd.click(function(){
				client.goChannel($(this).attr('id'), onChannel);
			});
		}
	} 		
}

function showChannels(gdata){
	if ($('#info .content.channels').css('display')=='none'||gdata){
		$('#info .tabs .channels').trigger('click'); 
		if (gdata){
			fillchannelsdata(gdata);
		} else {
			client.getChannels(fillchannelsdata);
		}
	}
}

function showHistory(){
	historyprocess=true; 
	client.getHistory(0, function(data){
		$('#info .content.history .list').html('');
		for (var t in data){
			var track=data[t];
			addhistory(data[t]);
			
		}
		historyprocess=false; 
	});
}


function addhistory(track){
	var item=$('<li class="item"></li>').appendTo('#info .content.history .list');
	var base=$('<div class="base"></div>').appendTo(item);
	var date=new Date(track.tt);
	base.append('<table><tr><td class="cover"><div class="artwork"><img src="img/nocover.png"></div></td><td class="name"><div class="artist">'+track.a+'</div><div class="title">'+track.t+'</div></td><td class="time">'+date+'</td><td class="rating"><div>'+track.r+'</div></td></tr></table>');
	var inf=track.i;
	var full=$('<div class="full"></div>').appendTo(item);
	full.attr('id',track.id);
	var voting=$('<div class="votebar"></div>').appendTo(full);
	var tags=$('<div class="tags"></div>').appendTo(full);	
	var info=$('<div class="info">'+inf+'</div>').appendTo(full);
	full.append('<div class="sender">by <a href="javascript:getuser('+track.sid+');void(0);">'+track.s+'</a></div>');
	for (var t in track.tg){
		var tagitem=$('<div class="tag">'+track.tg[t].n+'</div>').appendTo(tags);
		tagitem.attr('tagid', track.tg[t].id);
	}
	$('<span><a href="http://vk.com/audio?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>vk</a></span>').appendTo(tags);
	$('<span><a href="http://muzebra.com/search/?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>muzebra</a></span>').appendTo(tags);
	$('<span><a href="javascript:addTr('+track.id+');void(0);">>в чат</a></span>').appendTo(tags);
	item.addClass('trackid'+track.id);
	lht= new Date(track.tt);
	if (client.user){
		for (var vr in track.p){
			if (track.p[vr].vid==client.user.id){
				base.find('.rating div').css('color','#ffae00');
				break;
			}
		}
		for (var vr in track.n){
			if (track.n[vr].vid==client.user.id){
				base.find('.rating div').css('color','#000000');
				break;
			}
		}
	}
}


function addprofile(track){
	var item=$('<li class="item"></li>').appendTo('#info .content.profile .list');
	var base=$('<div class="base"></div>').appendTo(item);
	var date=new Date(track.tt);
	//var date=track.tt.geDay+" - "+track.tt.getHours()+':'+track.getMinutes();
	base.append('<table><tr><td class="cover"><div class="artwork"><img src="img/nocover.png"></div></td><td class="name"><div class="artist">'+track.a+'</div><div class="title">'+track.t+'</div></td><td class="time">'+date+'</td><td class="rating"><div>'+track.r+'</div></td></tr></table>');
	var inf=track.i;
	var full=$('<div class="full"></div>').appendTo(item);
	full.attr('id',track.id);
	var voting=$('<div class="votebar"></div>').appendTo(full);
	var tags=$('<div class="tags"></div>').appendTo(full);	
	var info=$('<div class="info">'+inf+'</div>').appendTo(full);
	full.append('<div class="sender">by <a href="javascript:getuser('+track.sid+');void(0);">'+track.s+'</a></div>');
	for (var t in track.tg){
		var tagitem=$('<div class="tag">'+track.tg[t].n+'</div>').appendTo(tags);
		tagitem.attr('tagid', track.tg[t].id);
	}
	$('<span><a href="http://vk.com/audio?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>vk</a></span>').appendTo(tags);
	$('<span><a href="http://muzebra.com/search/?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>muzebra</a></span>').appendTo(tags);
	$('<span><a href="javascript:addTr('+track.id+');void(0);">>в чат</a></span>').appendTo(tags);
	item.addClass('trackid'+track.id);
	lht= new Date(track.tt);
	if (client.user){
		for (var vr in track.p){
			if (track.p[vr].vid==client.user.id){
				base.find('.rating div').css('color','#ffae00');
				break;
			}
		}
		for (var vr in track.n){
			if (track.n[vr].vid==client.user.id){
				base.find('.rating div').css('color','#000000');
				break;
			}
		}
	}
}



function onChannel(data){
	setCurrent(data.current);
	setcurtime(true);
	$.Storage.set("channel", client.channel.chid+' ');
	$('#console .info .chname').html('<a href="javascript:showChannels();void(0);">'+data.name+'<a>');
	$('#console .info .chdata').html('<span>Слушают: </span>'+data.lst);
	$('#console .info .chdata').html('<span>Слушают: </span>'+data.lst+'<span> из них активно: </span>'+data.a);
	$('#console .streamcontrol .links').html('<a href="'+client.channel.hi+'" target="_blank">192kbps</a><span>|</span><a href="'+client.channel.low+'" target="_blank">96kbps</a>')
	$('#playlist .list').html('');
	
	for (var t in data.pls){
		addtrack(data.pls[t]);
	}
	updatetimes();
	if (client.user){
		$('#info .tabs .chat').trigger('click');
	}
	if (data.changed){
		var startplay=$.Storage.get("play");
		if (startplay=='true'){
			player.play(client.channel.hi);
			$.Storage.set("play", 'false');
			$('#console .streamcontrol .play').click();
		}	
	}

}

function getuser(id){
	if (client.user){
		if (!$('#info .tabs .tab.profile').hasClass('active')){
    		$('#info .tabs .tab').removeClass('active').children('a').removeClass('hover');
    		$('#info .tabs .tab.profile').addClass('active').children('a').addClass('hover');
    		$('#info .content').hide();
    		$('#info .content.profile').show();
    	}

	client.getUser({'id':id}, function (data){   
		var inpositive=false;
		var innegative=false;
		$('#info .content.profile').html("<div class='main'><div class='karma'><table class ='kr'><tr><td class='but negative'></td><td class='numb'>"+data.r+"</td><td class='but positive'></td></tr></table></div><div class='username'>"+data.name+"</div><div class='uid'>#"+data.id+"</div></div><div class='shift'></div>");
 		var butpositive=$('#info .content.profile .karma .but.positive');
		var butnegative=$('#info .content.profile .karma .but.negative');
		var numb=$('#info .content.profile .karma .numb');		
		var updatekarma=function(vdata) {
			numb.css('color','#bbb');
			if (vdata.id==id){
					data.p=vdata.p;
					data.n=vdata.n;
					inpositive=false;
					innegative=false;
			for (var vr in data.p){
				if (data.p[vr].vid==client.user.id){
					inpositive=true;
					numb.css('color','#ffae00');
					break;
				}
			}
			for (var vr in data.n){
				if (data.n[vr].vid==client.user.id){
					innegative=true;
					numb.css('color','#000000');
					break;
				}
			}
	
			numb.html(vdata.r);
			}
		}
		updatekarma(data);
		if (data.id!=client.user.id){
			butnegative.click(function(){
				var vote=-1;
				if (innegative){
					vote=0;
				}
				var data={
					'v':vote,
					'id':id
				}
				client.adduservote(data, updatekarma);
			});
			butpositive.click(function(){
				var vote=1;
				if (inpositive){
					vote=0;
				}
				var data={
					'v':vote,
					'id':id
				}
				client.adduservote(data, updatekarma);
			});
		} else {
			butpositive.css('visibility','hidden');
			butnegative.css('visibility','hidden');
		}
		var scroller=$("<div class='inner'></div>").appendTo($('#info .content.profile'));
		var pic=$("<div class='pic'><span>+</span></div>").appendTo(scroller);
		
		
		var date=new Date(data.reg);
		var invitestring='';
		if (data.invites.u.length>0){
			for (var i in data.invites.u){
				invitestring+='<span><a href="javascript:getuser('+data.invites.u[i].id+');void(0);">'+data.invites.u[i].n+'</a> </span>'
			}
		} else {
			invitestring='никого';
		}
		var userparent='';
		if (data.invites.p){
			userparent=' по приглашению <a href="javascript:getuser('+data.invites.p.id+');void(0);">'+data.invites.p.name+'</a>';
		}
		var info=$("<div class='userinfo'></div>").appendTo(scroller);
		if (data.g){
			    info.html("С нами с "+date.format('dd.mm.yyyy')+userparent+"<p>Принес "+data.trx+" треков. Их средний рейтинг: "+data.rt+"<p>Понаприглашал: "+invitestring)
		    } else {
		    	info.html("С нами с "+date.format('dd.mm.yyyy')+userparent+"<p>Принесла "+data.trx+" треков. Их средний рейтинг: "+data.rt+"<p>Понаприглашала: "+invitestring)
			}
		if (data.id!=client.user.id){
			var muteuser=$('<br><label><input type="checkbox" name="muteuser" id="usermute">ОМММ</label>').appendTo(info);
			var muted=$.Storage.get("muteuser"+data.id);
			if (muted){
				$('#usermute').attr('checked','true');
			}
			$('#usermute').click(function() {
		    	var m=$(this).is(':checked');
		    	if (m){
			    	$.Storage.set("muteuser"+data.id, 'true');
			    	fillUserlist();
			    } else {
				   	$.Storage.remove("muteuser"+data.id);
				   	fillUserlist();
			    }
		    });
		}

		
		var tabs=$("<table class ='p_tabs'><tr><td class='tab uploads'><a href='javascript:void(0);'>Загрузки</a></td><td class='tab positive'><a href='javascript:void(0);'>Плюсы</a></td><td class='tab negative'><a href='javascript:void(0);'>Минусы</a></td><td class='tab options'><a href='javascript:void(0);'>Подводные камни</a></td></tr></table>").appendTo(scroller);	
		var list=$("<ul class='list'></ul>").appendTo(scroller);

		$('#info .content.profile .p_tabs .tab').bind('click', function() {
    		if (!$(this).hasClass('active')){
    			$('#info .content.profile .p_tabs .tab').removeClass('active').children('a').removeClass('hover');
    			$(this).addClass('active').children('a').addClass('hover');
    		
    			if ($(this).hasClass('options')){
    			$('#info .content.profile .list').html('<div class="option"><label><input type="checkbox" name="tink" id="tink">Тинькать когда мне приходит сообщение</label></div><div class="option"><label><input type="checkbox" name="showimg" id="showimg">Показывать картинки</label></div><div class="option"><label><input type="checkbox" name="female" id="female">Ура! Я женщина!</label></div> <div class="option" id="passchange"><input class="oldpass" type="text" placeholder="Старый пароль"><br><input class="new1" type="password" placeholder="Новый пароль"><br><input class="new2" type="password" placeholder="Еще раз"><br><div class="send"><a href="javascript:passchanger();void(0);">Сменить пароль</a></div><div class="errors"></div> <div id="optionexit"><a href="javascript:logout();void(0);"><img src="/img/exit.png" alt="Эвакуация"></a></div> </div></div>');
	    			$('#tink').attr('checked', tink);
	    			$('#female').attr('checked', !data.g);
	    			$('#showimg').attr('checked', !noimg);
	    			
	    			$('#tink').click(function() {
		    			tink=$(this).is(':checked');
		    			settink();
		    		});
		    		$('#female').click(function() {
		    			var gender=!$(this).is(':checked');
		    			client.updateUserData({
		    				g:gender
		    			});

		    			if (gender){
			    			info.html("С нами с "+date.format('dd.mm.yyyy')+userparent+"<p>Принес "+data.trx+" треков. Их средний рейтинг: "+data.rt+"<p>Понаприглашал: "+invitestring)
		    			} else {
		    				info.html("С нами с "+date.format('dd.mm.yyyy')+userparent+"<p>Принесла "+data.trx+" треков. Их средний рейтинг: "+data.rt+"<p>Понаприглашала: "+invitestring)
			    			
		    			}
		    		});
		    		$('#showimg').click(function() {
		    			noimg=!$(this).is(':checked');
		    			setnoimg();
		    		});
	    			if (data.invites.i){
	    				if (data.invites.i.length){
		    				var invts=$('<div class="option"><div class="toper">Прямо сейчас ты можешь пригласить сюда замечательного человека!</div></div>').appendTo($('#info .content.profile .list'));
		    				for (var inv in data.invites.i)	{
			    				var form=$("<div class='sendform'><div class='minput'></div></div>").appendTo($('#info .content.profile .list'));
			    				var input=$("<input class='mailinput' id='"+data.invites.i[inv]+"' type='text' placeholder='Email'>").appendTo(form.children('.minput'));
			    				var sender=$("<div class='send'><a href='javascript:void(0);'>Отправить</a></div>").appendTo(form);
			    				$(sender).attr('code', data.invites.i[inv]);
			    				sender.click(function(){
			    					var code=$(this).attr('code');
				    				var todel=$(this).parent();
				    				client.sendinvite($('#'+code).val(), code, function(data){
					    				if (data.ok){
						    				$('<div class="message"><p>Твой инвайт ушел на '+data.m+'</p></div>').appendTo($('#chatmessages'));
						    				$('#info .content.chat .log').animate({scrollTop: $('.log')[0].scrollHeight},1200);
						    				todel.remove();
					    				}
				    				})
			    				});
			    				
		    				}
	    				} else {
		    				$('<div>У тебя еще нет инвайтов.</div>').appendTo($('#info .content.profile .list'));	
	    				}
	    				

	    			}	    			
	    			
    			}
    			if ($(this).hasClass('uploads')){
	    			$('#info .content.profile .list').html('');
	    			client.getUser({'id':id, 'uplshift':0}, function (data){
	    				
		    			if (data.length){
		    				for (var t in data){
			    				addprofile(data[t]); 
			    			}
			    		}
			    	});
			    }
			    if ($(this).hasClass('positive')){
	    			$('#info .content.profile .list').html('');
	    			client.getUser({'id':id, 'uplshift':0, 'p':true}, function (data){
	    				
		    			if (data.length){
		    				for (var t in data){
			    				addprofile(data[t]);
			    			}
			    		}
			    	});
			    }
			    if ($(this).hasClass('negative')){
	    			$('#info .content.profile .list').html('');
	    			client.getUser({'id':id, 'uplshift':0, 'p':false}, function (data){
	    				
		    			if (data.length){
		    				for (var t in data){
			    				addprofile(data[t]);
			    			}
			    		}
			    	});
			    }
			}
			
		});
		var topline=tabs[0].offsetTop-(tabs.height()+$('#info .content.profile .main').height())+5;
		
		$(scroller).scroll(function () {
			if ($(this).scrollTop()-topline>0&&!tabs.hasClass('top')){
					tabs.addClass('top');
					$('#info .content.profile .shift').css('height', 60+tabs.height()+'px');
					var profileshift=$('#info .tabs').height()+$('#info .content.profile .main').height()+$('#info .content.profile .p_tabs').height();
					$('#info .content.profile .inner').height($(window).height() - profileshift);
			} 
			if ($(this).scrollTop()-topline<0&&tabs.hasClass('top')){
					tabs.removeClass('top');
					$('#info .content.profile .shift').css('height', '60px');
					var profileshift=$('#info .tabs').height()+$('#info .content.profile .main').height();
					$('#info .content.profile .inner').height($(window).height() - profileshift);
			} 

		 if ($(this).children('.list').height()-$(this).scrollTop()-$(this).height()<300&&!historyprocess){
			  
			 if ($('#info .content.profile .p_tabs .uploads').hasClass('active')){
			  historyprocess=true;
			  	client.getUser({'id':id, 'uplshift':lht}, function (data){	
		    		if (data.length){
		    			for (var t in data){
			    			addprofile(data[t]);
			    		}
			    	}
			    	historyprocess=false;
			    });
			 }
			 if ($('#info .content.profile .p_tabs .negative').hasClass('active')){
			 	historyprocess=true;
			  	client.getUser({'id':id, 'uplshift':lht, 'p':false}, function (data){	
		    		if (data.length){
		    			for (var t in data){
			    			addprofile(data[t]);
			    		}
			    	}
			    	historyprocess=false;
			    });
			 }
			 if ($('#info .content.profile .p_tabs .positive').hasClass('active')){
			 	 historyprocess=true;
			  	client.getUser({'id':id, 'uplshift':lht, 'p':true}, function (data){	
		    		if (data.length){
		    			for (var t in data){
			    			addprofile(data[t]);
			    		}
			    	}
			    	historyprocess=false;
			    });
			 }
		 }

		});
	
	
	
	
		if (id!=client.user.id){
			$('#info .p_tabs .options').hide(400);
		} else {
			$('#info .p_tabs .options').show(400);
		}
		$('#info .content .inner').height($(window).height() - $('#info .tabs').height()-$('#info .tabs.profile .main').height());
		$('#info .content.profile .p_tabs .uploads').click();	
		
	});
	}
}
function passchanger(){
	$('#passchange .errors').html('');
	var cur=$('#passchange .oldpass').val();
	var new1=$('#passchange .new1').val();
	var new2=$('#passchange .new2').val();
	if (cur.length){
		if (new1.length>2){
			if (new1==new2){
				cur=hex_md5(cur);
				new1=hex_md5(new1);
				client.changepass(cur,new1, function(data){
					if (data.ok){
						$('#passchange .errors').html('Все получилось! Запомни свой новый пароль ;)');
						if (remember_name){
							$.Storage.set("password", new1);
						}
					} else {
						if (data.e='wrong'){
							$('#passchange .errors').html('Текущий пароль не совпадает');
						} else {
							$('#passchange .errors').html('Кажется что-то пошло не так');
						}
					}
				});
			} else{
				$('#passchange .errors').html('Новые пароли не совпадают. Попробуй еще раз');
			}
		} else {
			$('#passchange .errors').html('В пароле должно быть хотя бы 3 символа');
		}	
	} else {
		$('#passchange .errors').html('Старый пароль все же придется ввести');
	}
}

function processLogin(data){
	if (data.user){
		newTagline();
		$('.loginform').hide(400);
		$('.submit_box').show(400);
		$('#info .tabs .chat').show();
		$('#info .tabs .profile').show();
		$('#console .upfiles').show();
		
		var ch=$.Storage.get("channel");

		if (ch){
			client.goChannel(parseInt(ch), onChannel);
		} else{
			client.goChannel(1, onChannel);
		}
	} else {
		$('.loginform .alert').html(data.error);
		if (!client.channel.id){
			var ch=$.Storage.get("channel");
			if (ch){
				client.goChannel(parseInt(ch), onChannel);
			} else{
				client.goChannel(1, onChannel);
			}
		}
	}
}

function goLogin(){
	$('.loginform .alert').html('');
	if (recovery){
		var mail=$('#lgname').val();
		if (mail.length>3){
			client.recover(mail, function(data){
				if (data.ok){
					$('.loginform .alert').html(data.m);
				} else {
					if (data.e=='no user'){
						$('.loginform .alert').html('С таким почтовым ящиком ни кто не регистрировался (');
					} else {
						$('.loginform .alert').html(data.e);	
					}
				}
			});
		} else {
			$('.loginform .alert').html('Я не смогу восстановить пароль без адреса почтового ящика');
		}
	} else {
		var name=$('#lgname').val(),
			pass=$('#lgpass').val();
		if ( name.length>0 && pass.length>0 ){
			pass=hex_md5(pass);
			if (remember_name){
				$.Storage.set("username", name);
				$.Storage.set("password", pass);
			} else {
				$.Storage.remove("username");
				$.Storage.remove("password");
			}
			client.login(name, pass, processLogin);
		}
	}
}


function proc(pos){
	return (pos/$(window).width())*100+'%';
}

function setCurrent(track){
	var cur=$('#playlist .current').html('');
	var base=$('<div class="base"></div>').appendTo(cur);
	var src=track.src;
	if (!src){
		src="img/nocover.png"
	}
	var fastag=''
	if (track.tg.length>0){
		fastag='<div class="tag">'+track.tg[0].n+'</div>';
	}
	if (track.tg.length>1){
		fastag+='...';
	} 
	base.append('<table><tr><td class="cover"><div class="artwork"><img src="'+src+'"></div></td><td class="name"><span class="artist">'+track.a+'</span><span style="position: absolute; top: -50px;"> - </span><br><span class="title">'+track.t+'</span></td><td class="fastag"><div class="intag">'+fastag+'</div></td><td class="rating"><div>'+track.r+'</div></td></tr></table>');
	var inf=track.i;
	
	if ((track.p.length/client.channel.a)>0.6&&client.channel.a>9&&track.n.length<3){
		$('#playlist .current .artwork').css('border','2px solid #ffcd00');
	} else {
		$('#playlist .current .artwork').css('border','1px solid #aaa');
	}
	cur.attr('trackid', track.id);
	
	if (client.user){
		for (var vr in track.p){
			if (track.p[vr].vid==client.user.id){
				base.find('.rating div').css('color','#ffae00');
				break;
			}
		}
		for (var vr in track.n){
			if (track.n[vr].vid==client.user.id){
				base.find('.rating div').css('color','red');
				break;
			}
		}
	}
	
	var full=$('<div class="full"></div>').appendTo(cur);
	var voting=$('<div class="votebar"></div>').appendTo(full);
	var tags=$('<div class="tags"></div>').appendTo(full);	
	var info=$('<div class="info">'+inf+'</div>').appendTo(full);
	full.append('<div class="sender">by <a href="javascript:getuser('+track.sid+');void(0);">'+track.s+'</a></div>');
	cur.append('<div class="timer"><div class="cursor"></div></div>');
	
	for (var t in track.tg){
		var tagitem=$('<div class="tag">'+track.tg[t].n+'</div>').appendTo(tags);
		tagitem.attr('tagid', track.tg[t].id);
	}
	$('<span><a href="http://vk.com/audio?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>vk</a></span>').appendTo(tags);
	$('<span><a href="http://muzebra.com/search/?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>muzebra</a></span>').appendTo(tags);
	$('<span><a href="javascript:addTr('+track.id+');void(0);">>в чат</a></span>').appendTo(tags);
	full.hide();
	base.click(function(){
		$('.intag').css('display','block');
		$('#playlist .item .full').hide(400);
		
		if (!$(this).hasClass('expanded')){
			$(this).find('.intag').css('display','none');
			$(this).addClass('expanded');
		} else{
			$(this).find('.intag').css('display','block');
			$(this).removeClass('expanded');
		}
		if ($(this).hasClass('expanded')&&client.user){
			
			$(voting).html('');
			var down=$('<div class="down but"></div>').appendTo(voting);
			var numb=$('<div class="numb">'+client.channel.current.vote+'</div>').appendTo(voting);
			var up=$('<div class="up but"></div>').appendTo(voting);
			$(up).click(function(){
				client.addvote({'id':track.id, 'v':client.user.w});
			});
			$(down).click(function(){
				client.addvote({'id':track.id, 'v':-client.user.w});
			});
		}
		
		full.toggle({step:onresize});
	});
	onresize();
}

function logout(){
	client.logout(function (){
		$('#info .content').hide();
		$.Storage.remove("username");
		$.Storage.remove("password");
		$('.loginform').show(400);
		$('.submit_box').hide(400);
		$('#info .tabs .chat').hide();
		$('#info .tabs .profile').hide();
		$('#console .upfiles').hide();
		$('#console .userinfo').hide();
		showChannels();
	});
}


function removetrack(trackid){
	$('#playlist .list .trackid'+trackid).hide('slow', function(){ this.remove(); });
}
function addtrack(track){
	var item=$('<li class="item"></li>').appendTo($('#playlist .list'));
	var base=$('<div class="base"></div>').appendTo(item);
	
	var fastag=''
	if (track.tg.length>0){
		fastag='<div class="tag">'+track.tg[0].n+'</div>';
	}
	if (track.tg.length>1){
		fastag+='...';
	} 
	base.append('<table><tr><td class="cover"><div class="artwork"><img src="img/nocover.png"></div></td><td class="name"><div class="artist">'+track.a+'</div><div class="title">'+track.t+'</div></td><td class="fastag"><div class="intag">'+fastag+'</div></td><td class="time"></td><td class="rating"><div>'+track.r+'</div></td></tr></table>');
	var inf=track.i;
	var full=$('<div class="full"></div>').appendTo(item);
	full.attr('id',track.id);
	var voting=$('<div class="votebar"></div>').appendTo(full);
	var tags=$('<div class="tags"></div>').appendTo(full);	
	var info=$('<div class="info">'+inf+'</div>').appendTo(full);
	full.append('<div class="sender">by <a href="javascript:getuser('+track.sid+');void(0);">'+track.s+'</a></div>');
	for (var t in track.tg){
		var tagitem=$('<div class="tag">'+track.tg[t].n+'</div>').appendTo(tags);
		tagitem.attr('tagid', track.tg[t].id);
	}
	$('<span><a href="http://vk.com/audio?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>vk</a></span>').appendTo(tags);
	$('<span><a href="http://muzebra.com/search/?q='+encodeURIComponent(track.a)+' - '+encodeURIComponent(track.t)+'" target="_blank">>muzebra</a></span>').appendTo(tags);
	$('<span><a href="javascript:addTr('+track.id+');void(0);">>в чат</a></span>').appendTo(tags);
	full.hide();
	item.attr('id', track.id);
	item.attr('rating', track.r);
	item.addClass('trackid'+track.id);
	if (client.user){
		for (var vr in track.p){
			if (track.p[vr].vid==client.user.id){
				base.find('.rating div').css('color','#ffae00');
				break;
			}
		}
		for (var vr in track.n){
			if (track.n[vr].vid==client.user.id){
				if (track.current){
					base.find('.rating div').css('color','red');
				} else {
					base.find('.rating div').css('color','#000000');
				}
				break;
			}
		}
	}
	
	
	base.click(function(){
		$('.intag').css('display','block');
		$('#playlist .current .base').removeClass('expanded');
		$('#playlist .current .full').hide(400);
		$('#playlist .item').each(function(){
			var b=$(this).children('.base');
			var f=$(this).children('.full');
			if ($(this).attr('id')!=item.attr('id')){
			 	$(f).hide(400);
				$(b).removeClass('expanded');
		
			}
		});
		
		
		if (!$(this).hasClass('expanded')){
			$(this).find('.intag').css('display','none');
			$(this).addClass('expanded');
		} else{
			$(this).find('.intag').css('display','block');
			$(this).removeClass('expanded');
		}

		if ($(this).hasClass('expanded')&&client.user){
			$(voting).html('');
			var down=$('<div class="down but"></div>').appendTo(voting);
			var negative=$('<div class="negative but"></div>').appendTo(voting);
			var numb=$('<div class="numb">'+client.track(track.id).vote+'</div>').appendTo(voting);
			var positive=$('<div class="positive but"></div>').appendTo(voting);
			var up=$('<div class="up but"></div>').appendTo(voting);
			if (client.user.id==track.sid){
				var kill=$('<div class="kill"><img src="/img/kill.png"></div>').appendTo(voting);
				kill.click(function (){
					client.killtrack(track.id);
				});
			}
			$(up).click(function(){
				client.addvote({'id':track.id, 'v':client.user.w});
			});
			
			$(down).click(function(){
				client.addvote({'id':track.id, 'v':-client.user.w});
			});
			
			$(positive).click(function(){
				var vote=client.track(track.id).vote+1;
				client.addvote({'id':track.id, 'v':vote});
				
			});
			$(negative).click(function(){ 
				var vote=client.track(track.id).vote-1;
				client.addvote({'id':track.id, 'v':vote});
			});
		} 
		
		full.toggle(400);
	});
	base.hover( function (ein){

		$(this).addClass('tru');
		updatetimes();
	}, function (eout){

		$(this).removeClass('tru');
		updatetimes();
	} );
	sortTracks();
}

function opentrack(id){
	var item=null
	if (client.channel.current.id==id){
		item=$('#playlist .current');
		item.css('background','#ffcd00');
		item.animate({backgroundColor:'#333'},1000);
		
	} 
	if ($('#playlist .list .trackid'+id).length>0){
		item=$('#playlist .list .trackid'+id);	
		item.css('background','#ffcd00');
		item.animate({backgroundColor:'#ffffff'},1000);
		$('.inner').animate({scrollTop: item[0].offsetTop-item.children('.full').height()},1200);
	}
	if (item){
		var base=item.children('.base');
		if (!$(base).hasClass('expanded')){
			base.trigger('click');
		}
	} else {
		console.log('not finded');
	}

	
}

function updateTrack(track){
	var item=null
	if (track.current){
		item=$('#playlist .current');
		if ((track.p.length/client.channel.a)>0.6&&client.channel.a>9&&track.n.length<3){
			$('#playlist .current .artwork').css('border','2px solid #ffcd00');
		} else {
			$('#playlist .current .artwork').css('border','1px solid #aaa');
		}
	} else {
		item=$('#playlist .list .trackid'+track.id);
	}
	item.find('.rating').html('<div>'+track.r+'</div>');
	item.attr('rating', track.r);
	item.attr('vote', track.vote);	
	item.find('.numb').html(track.vote);
	item.find('.rating div').css('color','#bbb');
	if (client.user){
		for (var vr in track.p){
			if (track.p[vr].vid==client.user.id){
				item.find('.rating div').css('color','#ffae00');
				break;
			}
		}
		for (var vr in track.n){
			if (track.n[vr].vid==client.user.id){
				if (track.current){
					item.find('.rating div').css('color','red');
				} else {
					item.find('.rating div').css('color','#000000');
				}
				break;
			}
		}
	}
	sortTracks();
}

function sf(a,b){
	var dif=$(b).attr('rating')-$(a).attr('rating');
	if (dif!=0){
		return dif;
	} else {
		return $(a).attr('id')-$(b).attr('id');
	}
}

function sortTracks(){
	$('#playlist .item').sort(sf).appendTo('#playlist .list')
}

function setcurtime(fast){
	if (!fast){
		$('#playlist .current .timer .cursor').animate({width: client.channel.ct/client.channel.current.tt*$('#playlist .current .timer').width()},500);	
	} else {
		$('#playlist .current .timer .cursor').css({'width':client.channel.ct/client.channel.current.tt*$('#playlist .current .timer').width()});
	}
}
function updatetimes(){
	var offset=client.channel.current.tt-client.channel.ct;
	
	for (var t in client.channel.pls){
		var item=$('#playlist .trackid'+client.channel.pls[t].id+' .base');
		if (!item.hasClass('tru')){
			$('#playlist .trackid'+client.channel.pls[t].id+' .time').html("+"+secToTime(offset));
		} else {
			$('#playlist .trackid'+client.channel.pls[t].id+' .time').html(secToTime(client.channel.pls[t].tt));
		}
		offset+=client.channel.pls[t].tt;
	}
}

function secToTime(time){
	var hour=Math.floor(time / 3600);
	var m=Math.floor(time / 60);
	if (hour>0){
		m-=hour*60;
	}
	var min= (m < 10) ? "0" + m: m;
	var sec = (Math.floor(time % 60) < 10) ? "0" + Math.floor(time % 60):Math.floor(time % 60);
	if (hour>0){
		return hour+':'+ min+':'+sec;
	} else{
		return min+':'+sec;
	}
	
}


var sectrack=setInterval(function(){
	if (messages.length){
		now=new Date().getTime();
		for (var a=messages.length; a>0; a--){
			if (messages.length>a){
				upadateMT(messages[a]);
			}
		}
	}
}, 5000);

$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if (this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if (this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

