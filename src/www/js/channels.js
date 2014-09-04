function fillchannelsdata(d) {
    var sorting = function(a, b) {
        if (a.lst) {
            var dif = b.lst - a.lst;
            if (dif != 0) {
                return dif;
            } else {
                return a.id - b.id;
            }
        } else {
            return a.id - b.id;
        }
    }

    var fillbanlist = function(blist, banned) {
        $(blist).html('');
        var chid = blist.attr('id');
        var bancontrol = false;

        if (client.user.prch || client.user.opch) {
            if (client.user.prch == chid || client.user.opch == chid) {
                bancontrol = true;
            }
        }
        for (var b in banned) {
            var bu = banned[b];
            var bstr = '<li><a class="banned-name" href="javascript:getuser(' + bu.id + ');void(0);">' + bu.name + '</a> &mdash; <span class="descr">' + bu.reason + '</span>';
            if (bancontrol) {
                bstr += '<a href="javascript:void(0);" id="' + bu.id + '" class="delete"></a>';
            }
            bstr += '</li>';
            var bnode = $(bstr).appendTo(blist);
            $(bnode).children('.delete').click(function(event) {
                var bl = event.target.parentNode.parentNode;
                console.log(event.target.id);
                client.unbanuser(event.target.id, function(cd) {
                    console.log(cd);
                    if (cd.banned) {
                        fillbanlist($(bl), cd.banned);
                    }
                });
            });
        }
    }
    var filleditorslist = function(elist, editors) {
        $(elist).html('');
        console.log(elist);
        console.log(editors);
        var editorscontrol = false;
        var chid = elist.attr('id');
        if (client.user.prch) {
            if (client.user.prch == cd.id) {
                editorscontrol = true;
            }
        }
        for (var e in editors) {
            var ed = editors[e];
            var estr = '<li><a class="editor-name" href="javascript:getuser(' + ed.id + ');void(0);">' + ed.name + '</a> &mdash; <span class="descr">' + ed.post + '</span>';
            if (editorscontrol) {
                estr += '<a href="javascript:void(0);" class="delete" id="' + ed.id + '"></a>';
            }
            estr += '</li>';
            var enode = $(estr).appendTo(elist);
            $(enode).children('.delete').click(function(event) {
                console.log(event);
                var bl = event.target.parentNode.parentNode;
                console.log(bl.id);
                client.removeop({id: event.target.id, chid: bl.id}, function(cd) {
                    console.log(cd);
                    if (cd.editors) {
                        filleditorslist($(bl), cd.editors);
                    }
                });
            });
        }
    }

    $('#info .content.channels .list').html('');
    $('#info .content.channels').show();
    if (d.channels.length > 0) {
        if (d.channels[0].lst) {
            d.channels.sort(sorting);
        }
        for (var c in d.channels) {
            var cd = d.channels[c];
            var chdd = $('<li class="channel"></li>').appendTo($('#info .content.channels .list'));
            var channeldom = '<div class="base"><a href="javascript: client.goChannel(' + cd.id + ', onChannel);void(0);" class="name">' + cd.name + '</a><a href="' + streampath + cd.hi;
            channeldom += '" target="_blank">192kbps</a> <a href="' + streampath + cd.low;
            channeldom += '" target="_blank">96kbps</a><div class="listners"><span>Слушают:</span>' + cd.lst + '</div><br /></div>';
            var chd = $(channeldom).appendTo(chdd);
            $('<div class="hint"><<<клик</div>').appendTo(chd);
            var description = $('<div class="description">' + cd.description + '</div>').appendTo(chd);
            if (client.user) {
                if (client.user.prch) {
                    if (client.user.prch == cd.id) {
                        $(description).attr('contentEditable', true);
                        var contents = $(description).html();
                        $(description).blur(function() {
                            if (contents != $(this).html()) {
                                var newdescr = $(this).html();
                                console.log(newdescr);
                                client.setprops({description: newdescr}, function(serverdata) {
                                    console.log(serverdata);
                                });
                                contents = $(this).html();
                            }
                        });
                    }
                }
            }
            if (cd.current) {
                // var current = $('<div class="current"><div class="cap">Сейчас:</div><div class="artist">' + cd.current.a + '</div><div class="title">' + cd.current.t + '</div><span><a href="http://vk.com/audio?q=' + encodeURIComponent(cd.current.a) + ' - ' + encodeURIComponent(cd.current.t) + '" target="_blank">>vk</a></span></div>').appendTo(chd);
                var current = $('<div class="current"><div class="cap">Сейчас:</div><div class="artist">' + cd.current.a + '</div><div class="title">' + cd.current.t + '</div></div>').appendTo(chd);
            }
            var users = $('<div class="users"></div>').appendTo(chd);
            for (var u in cd.users) {
                var instring = '<span><a href="javascript:getuser(' + cd.users[u].id + ');void(0);">' + cd.users[u].n + '</a> </span>'
                $(instring).appendTo(chd);
            }
            if (cd.prid) {
                var full = $('<section class="full clearfix" />').appendTo(chdd);
                var l_roll = $('<div class="l-col"/>').appendTo(full);
                var r_roll = $('<div class="r-col"/>').appendTo(full);
                var prman = '<div class="prman"><header>Продюсер:</header>';
                prman += '<a class="prman-crown" href="javascript:getuser(' + cd.prid + ');void(0);">' + cd.prname + '</a></div>';// &mdash; <span class="descr">Продюссер</span>';
                $(prman).appendTo(l_roll);
                //<a href="" class="delete"></a></div>'
                var edir = $('<div class="editors"/>').appendTo(l_roll);


                var addstr = '<header>Редакционная коллегия:</header>';
                if (client.user.prch) {
                    if (client.user.prch == cd.id) {
                        addstr += '<label><input class="id" type="text" placeholder="ID"><input class="editorpost" type="text" placeholder="Редактор">';
                        addstr += '<button id="' + cd.id + '">Ok</button></label>';
                    }
                }
                var adder = $(addstr).appendTo(edir);
                var elist = $('<ul class="editors-list" id="' + cd.id + '"></ul>').appendTo(edir);
                $(adder).children('button').click(function(e) {
                    var edid = $(e.target.parentNode).find('input.id').val();
                    var edpost = $(e.target.parentNode).find('input.editorpost').val();
                    client.setop({id: edid, post: edpost, chid: e.target.id}, function(cd) {
                        if (cd.editors) {
                            filleditorslist($(e.target.parentNode.parentNode).find('.editors-list'), cd.editors);
                        }
                    });

                });
                if (cd.editors.length) {
                    filleditorslist(elist, cd.editors);
                }
                if (cd.banned.length || (client.user.prch==cd.id || client.user.opch==cd.id)) {
                    var bn = $('<div class="banned" />').appendTo(r_roll);
                    $('<header>Жертвы репрессий:</header>').appendTo(bn);

                    if (client.user.prch==cd.id || client.user.opch==cd.id) {
                        if (client.user.prch == cd.id || client.user.opch == cd.id) {
                            var addbanstr = '<label><input class="id" type="text" placeholder="ID">';
                            addbanstr += '<input type="text" class="reason" placeholder="Причина бана"><button>Ok</button></label></div>';
                        }

                    }
                    var bader = $(addbanstr).appendTo(bn);
                    var blist = $('<ul class="banned-list" id="' + cd.id + '"></ul>').appendTo(bn);
                    bader.children('button').click(function(e) {
                        var id = $(e.target.parentNode).find('input.id').val();
                        var reason = $(e.target.parentNode).find('input.reason').val();
                        client.banuser(id, reason, function(data) {
                            if (data.banned) {
                                fillbanlist($(e.target.parentNode.parentNode).find('.banned-list'), data.banned);
                            }
                        })
                    })


                    if (cd.banned.length) {
                        fillbanlist(blist, cd.banned);
                    }
                }


            }
            chd.click(function() {
                var chf = $(this.parentNode).children('.full');
                if (!$(chf).hasClass('active')) {
                    $('#info .content.channels .full').hide(400).removeClass('active');
                    $(chf).show(400).addClass('active');
                }
            });
        }
        $('#info .content.channels .full').hide();
    }
}
function showChannels(gdata) {
    if ($('#info .content.channels').css('display') == 'none' || gdata) {
        $('#info .tabs .channels').trigger('click');
        if (gdata) {
            fillchannelsdata(gdata);
        } else {
            client.getChannels(fillchannelsdata);
        }
    }
}