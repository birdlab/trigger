function loadUrl(url, reader, file, callback) {
    ID3.loadTags(url, function() {
        callback(ID3.getAllTags(url));
    },
    {tags: ["artist", "title"],
     dataReader: reader});
}


function addupload(file){
	var fup=$('<div class="uploaditem" />').appendTo($('#console .upfiles'));
	var trpath=$('<div class="path">'+file.name+'</div>').appendTo(fup);
	var abort=$('<div class="abort"></div>').appendTo(fup);
	var artist=$('<input class="finput artist" type="text" autocomplete="on" placeholder="Артист">').appendTo(fup);
	var title=$('<input class="finput title" type="text" placeholder="Название">').appendTo(fup);
	var trackinfo=$('<textarea class="finput trackinfo" type="text" placeholder="Пара слов от треке (не обязательно)"></textarea><br />').appendTo(fup);
	$('<span>Теги:</span>').appendTo(fup);
	var tagscontainer=$('<div class="tags"></div>').appendTo(fup);
	$('<input list="autotags" class="finput taginput" type="text" placeholder="начинай вводить..."><datalist id="autotags"></datalist><span>Enter - добавить</span>').appendTo(fup);
	var progress=$('<div class="progress"></div>').appendTo(fup);
	loadUrl(file.urn ||file.name, new FileAPIReader(file), file, function(tags){
		if (tags.artist){
			artist.val(tags.artist);
		} 
		if (tags.title){
			title.val(tags.title);
		}
	});
	var autotags=$(fup).children('#autotags');
	var taginput=$(fup).children('.taginput');
	var bar=$('<div class="bar"></div>').appendTo(progress);
	
	var trackupload=$('<div class="button upload"><a href="javascript:void(0);">Загрузить</a></div>').appendTo(fup);
	var tracksubmit=$('<div class="button send"><a href="javascript:void(0);">Отправить</a></div>').appendTo(fup);
	var errors=$('<div class="errors"></div>').appendTo(fup);
	var uploader=$('<input id="uploader" type="file" data-url="upload/server/php/" style="display:none">').appendTo(fup);

	var jqXHR=null
	$(progress).hide();
	$(uploader).fileupload({ add:function(){},progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $(bar).css('width', progress + '%');
    }});
    abort.click(function(){
    	if (jqXHR){
	    	jqXHR.abort();
    	}
    	fup.hide(300, function(){ this.remove(); });
    });
    var ready=false;
    var uploaded=false;
    var serverfilename=null;
    var tmt=null;
    var servertags=[];
    var temptags=[];
    var requested=false;
    
    
    var addtotags=function(){
	    	var chose=$(taginput).val();
	    	var is=false;
	    	console.log('start add');
			for (var t in temptags){
		    	if (temptags[t].n==chose){
		    		is=true;
		    		var inlist=false;
		    		for (var st in servertags){
			    		if (servertags[st].id==temptags[t].id){
				    		inlist=true;
				    		break;
			    		}
		    		}
		    		if (!inlist){
			    		servertags.push(temptags[t]);
			    		var tagitem=$('<div class="tag">'+temptags[t].n+'<div class="deltag" /></div>').appendTo($(tagscontainer));
			    		tagitem.attr('tagid', temptags[t].id);
			    		$(tagitem).children('.deltag').click(function(){
				    		for (var st in servertags){
					    		if (servertags[st].id==$(tagitem).attr('tagid')){
					    			
						    		console.log('tag to delete '+servertags[st].n);
						    		servertags.splice(st,1);
						    		console.log('new tags');
						    		console.log(servertags);
						    		break;
						    	}
						    }
						    $(tagitem).remove();
			    		});
			    		$(taginput).val('');
			    		requested=false;
		    		}
			    	break;
		    	}
		    }
		    if (!is){
		    	if (!requested){
		    		console.log('not requested');
			    	client.getTags($(taginput).val(), function(data){
						requested=true;
	    				temptags=data;
	    				console.log('now ok');
	    				addtotags();
		    		});
		    	} else {
		    		console.log('not finded');
			    	client.addTag($(taginput).val(), function(data){
			    		requested=true;
			    		temptags=data;
			    		console.log('add as new');
			    		console.log(temptags);
			    		addtotags();
		    		});
		    	}
		    }
    }
    
    taginput.bind("keyup", function(event){
	    if(event.keyCode == 13){
		    addtotags();
		 } else {
		 	if ($(taginput).val().length>0){
				if (tmt){
					clearTimeout(tmt);
				}
				tmt=setTimeout(function(){
					client.getTags($(taginput).val(), function(data){
						requested=true;
	    				temptags=data;
	    				var av=[];
	    				for (var t in temptags){
		    				av.push(temptags[t].n);
	    				}
	    				$(taginput).autocomplete({
		    					source: av,
		    					search:''
		    			});

		    		});
		    	}, 400);
			 }
		 }
	 });
    
    
    
    var tsubmit=function(){
		client.tracksubmit({
					'chid':client.channel.id, 
					'track':{ 
						'artist':artist.val(),
						'title':title.val(),
						'info':trackinfo.val(),
						'tags':servertags,
						'path':serverfilename
					}
				}, function (data){
					if (!data.error){
						fup.hide(300, function(){ this.remove(); });
					} else {
						errors.html(data.error);
					}
				});
    }

    var tupload=function(callback) {
    	 	trackupload.hide();
    		errors.html('');
			jqXHR = uploader.fileupload('send', {files: [file]} )
			.error(function (jqXHR, textStatus, errorThrown) {
				errors.html('Server upload error');
				trackupload.show();
			})
			.complete(function (result, textStatus, jqXHR) {	
				console.log(JSON.parse(result.responseText).files[0].name);
				serverfilename=JSON.parse(result.responseText).files[0].name;
				uploaded=true;
				if (ready){
					tsubmit();
				}
			});
			$(progress).show(200);
    }
    trackupload.click(tupload);
	tracksubmit.click(function (){
		var error=null;		
		if (!title.val().length>0){
			error=true;
			errors.html('У трека должно быть название!');
		}
		if (!artist.val().length>0){
			error=true;
			errors.html('Будь мужиком, укажи артиста!');
		}

		if (!error){
			ready=true;
			if (!jqXHR){
				tupload();
			} 
			if (uploaded){
				tsubmit();
			}
		}
	});

}