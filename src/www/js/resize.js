var deviceAgent = navigator.userAgent.toLowerCase();
$iOS = deviceAgent.match(/(iphone|ipod|ipad)/);
$ipad=deviceAgent.match(/(ipad)/);
$android=deviceAgent.match(/(android)/);
$mobile=$iOS&&$android;
if ($mobile){
	alert('mobile');
	$('#console').css({
		'width':console_minsize
	});
	$('#playlist').css({
		'width':playlist_minsize, 
		'margin-left':console_minsize
		});
	$('#info').css({
		'width':info_minsize, 
		'right': $(window).width()-minsize
		});
}

var scrolled=false;

var console_minsize=150,
	playlist_minsize=450,
	info_minsize=350,
	minsize=console_minsize+playlist_minsize+info_minsize;

	
$(document).ready(function() {
    $('#info .resizer').mousedown(function(e){
    	e.preventDefault();
    	$('body').css({'cursor': 'ew-resize'});
	    $(window).bind('mousemove', inforesize);
	    $(window).mouseup(function(){
	    	$('body').css({'cursor': ''});
	    	$(window).unbind('mousemove', inforesize);
	    });
    });
    
    $('#playlist .resizer').mousedown(function(e){
    	console.log('playlist on');
    	e.preventDefault();
    	$('body').css({'cursor': 'ew-resize'});
	    $(window).bind('mousemove', consoleresize);
	    $(window).mouseup(function(){
	    	$('body').css({'cursor': ''});
	    	$(window).unbind('mousemove', consoleresize);
	    });
    });
    var consolesize		=	$.Storage.get("console_size");
    var playlistsize	=	$.Storage.get("playlist_size");
    var infosize		=	$.Storage.get("info_size");
    

    if (consolesize)				$('#console').css({'width':consolesize});
    if (playlistsize&&consolesize)	$('#playlist').css({'width':playlistsize, 'margin-left':consolesize});
    if (infosize)					$('#info').css({'width':infosize});

});

function inforesize(e){
	var ww=$(window).width();
	if (e.pageX<ww-info_minsize&&e.pageX>console_minsize+playlist_minsize){
		$('#info').css({'width':proc(ww-e.pageX)});
		$.Storage.set("info_size",proc(ww-e.pageX));
		var to=ww-($('#info').width()+$('#console').width());
		
		if (to<playlist_minsize){
			$('#playlist').css({'width':proc(playlist_minsize), 'margin-left':proc(e.pageX-playlist_minsize)});
			$.Storage.set("playlist_size",proc(playlist_minsize));
			$('#console').css({'width':proc(e.pageX-playlist_minsize)});
			$.Storage.set("console_size",proc(e.pageX-playlist_minsize));
		} else {
			$('#playlist').css({'width':proc(to)});
			$.Storage.set("playlist_size",proc(to));
		}
		$('#playlist .current .timer .cursor').css({'width':client.channel.ct/client.channel.current.tt*$('#playlist .current .timer').width()});
	}
	
}
function consoleresize(e){
	var ww=$(window).width();
	if (e.pageX>console_minsize&&e.pageX<ww-(info_minsize+playlist_minsize)){
		$('#console').css({'width':proc(e.pageX)});
		$.Storage.set("console_size",proc(e.pageX));
		var to=ww-e.pageX-$('#info').width();
		if (to<playlist_minsize){
			$('#playlist').css({'margin-left': proc(e.pageX), 'width':proc(playlist_minsize)});
			$.Storage.set("playlist_size",proc(playlist_minsize));
			$('#info').css({'width':proc(ww-(e.pageX+playlist_minsize))});
			$.Storage.set("info_size",proc(ww-(e.pageX+playlist_minsize)));
		} else {
			$('#playlist').css({'margin-left': proc(e.pageX), 'width':proc(to)});
			$.Storage.set("playlist_size",proc(to));
		}
		$('#playlist .current .timer .cursor').css({'width':client.channel.ct/client.channel.current.tt*$('#playlist .current .timer').width()});
	}
	
}

function onresize(){
	$('#playlist .inner').height($(window).height() - $('#playlist .current').height());
	var tabsheight=$('#info .tabs').height();
	var chatheight=$(window).height() - $('#info .content.chat .input').height() - tabsheight;

	$('#info .content.history .inner').height($(window).height() - tabsheight-20);
    $('#info .content.channels .inner').height($(window).height() - tabsheight);

	var profileshift=$('#info .tabs').height()+$('#info .content.profile .main').height();
	if ($('#info .content.profile .p_tabs').hasClass('top')){
		profileshift+=$('#info .content.profile .p_tabs').height();
	}
	$('#info .content.profile .inner').height($(window).height() - profileshift);
	$('#info .content.chat .log').height(chatheight);
	$('#info .content.chat .users').height(chatheight);
	$('#info .content.chat .users .scroller').height(chatheight-30);
	
	if ($(window).width()<minsize&&!$mobile){
		$('#console').css({'width':console_minsize});
		$('#playlist').css({'width':playlist_minsize, 'margin-left':console_minsize});
		$('#info').css({'width':info_minsize, 'right': $(window).width()-minsize});
		scrolled=true;
	} else {
		if (scrolled){
			scrolled=false;
			$('#console').css({'width':proc(console_minsize)});
			$('#playlist').css({'width':proc($(window).width()-console_minsize-info_minsize), 'margin-left':proc(console_minsize)});
			$('#info').css({'width':proc(info_minsize), 'right': 0});
		}
	}
}

$(window).resize(onresize);
$('#console').resize(function(){
	console.log(this);
});