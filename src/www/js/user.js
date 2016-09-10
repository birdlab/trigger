/**
 * Created by Bird on 01.10.14.
 */

function getuser(id) {
    if (client.user) {
        if (!$('#info .tabs .tab.profile').hasClass('active')) {
            $('#info .tabs .tab').removeClass('active').children('a').removeClass('hover');
            $('#info .tabs .tab.profile').addClass('active').children('a').addClass('hover');
            $('#info .content').hide();
            $('#info .content.profile').show();
        }
        location.hash='#!/user/'+id;
        client.getUser({'id': id}, function(data) {
            var inpositive = false;
            var innegative = false;
            var profile = $('#info .content.profile');
            profile.html("<div class='main'><div class='karma'><table class ='kr'><tr><td class='but negative'></td><td class='numb'>" + data.r + "</td><td class='but positive'></td></tr></table></div><div class='username'>" + data.name + "</div><div class='uid'>#" + data.id + "</div></div><div class='shift'></div>");
            var butpositive = $('#info .content.profile .karma .but.positive');
            var butnegative = $('#info .content.profile .karma .but.negative');
            var numb = $('#info .content.profile .karma .numb');
            var updatekarma = function(vdata) {
                numb.css('color', '#bbb');
                if (vdata.id == id) {
                    data.p = vdata.p;
                    data.n = vdata.n;
                    inpositive = false;
                    innegative = false;
                    for (var vr in data.p) {
                        if (data.p[vr].vid == client.user.id) {
                            inpositive = true;
                            numb.css('color', '#ffae00');
                            break;
                        }
                    }
                    for (var vr in data.n) {
                        if (data.n[vr].vid == client.user.id) {
                            innegative = true;
                            numb.css('color', '#000000');
                            break;
                        }
                    }

                    numb.html(vdata.r);
                }
            }
            updatekarma(data);
            if (data.id != client.user.id) {
                butnegative.click(function() {
                    var vote = -1;
                    if (innegative) {
                        vote = 0;
                    }
                    var data = {
                        'v': vote,
                        'id': id
                    }
                    client.adduservote(data, updatekarma);
                });
                butpositive.click(function() {
                    var vote = 1;
                    if (inpositive) {
                        vote = 0;
                    }
                    var data = {
                        'v': vote,
                        'id': id
                    }
                    client.adduservote(data, updatekarma);
                });
            } else {
                butpositive.css('visibility', 'hidden');
                butnegative.css('visibility', 'hidden');
            }
            var scroller = $("<div class='inner'></div>").appendTo(profile);

            if (data.pic) {
                var upic = $("<div class='pic exist'><img src='" + data.pic + "'></div>").appendTo(scroller);
                $('.pic.exist img').error(function() {
                    $(this).unbind("error").attr("src", "/img/ear.png");
                });
            } else {
                var upic = $("<div class='pic'></div>").appendTo(scroller);
            }

            var date = new Date(data.reg);
            var invitestring = '';
            if (data.invites.u.length > 0) {
                for (var i in data.invites.u) {
                    invitestring += '<span><a href="javascript:getuser(' + data.invites.u[i].id + ');void(0);">' + data.invites.u[i].n + '</a> </span>'
                }
            } else {
                invitestring = 'никого';
            }
            var userparent = '';
            if (data.invites.p) {
                userparent = ' по приглашению <a href="javascript:getuser(' + data.invites.p.id + ');void(0);">' + data.invites.p.name + '</a>';
            }

            var info = $("<div class='userinfo'></div>").appendTo(scroller);
            var userdescription = $("<div class='infoedit' id='userdescription'></div>").appendTo(info);
            if (!data.i) {
                data.i = '';
                if (client.user) {
                    if (client.user.id == data.id) {
                        data.i = 'Здесь можно написать много смешных букв. Это увидят все';
                    }
                }
            }
            userdescription.html(data.i);

            if (client.user) {
                if (client.user.id == data.id) {
                    userdescription.attr('contentEditable', true);
                    var contents = $('#userdescription').html();
                    var pic = data.pic;
                    userdescription.keyup(function() {
                        console.log('keypressed')
                    });
                    info.click(function(e) {
                        if (!$(e.target).hasClass('infoedit')) {
                            var usertext = $('#userdescription').html();
                            if (usertext != contents) {
                                console.log('try to send', usertext);
                                client.updateUserData({
                                    i: usertext
                                });
                                contents = usertext;
                            }
                        }
                        if (!$(e.target).hasClass('picpath')) {
                            var path = $('#piclink').val();
                            if (path != pic && path.length) {
                                console.log('try to send pic');
                                client.updateUserData({pic: path});
                                pic = path;
                                upic.html('<img src=' + path + '>');
                            }
                        }
                        return false;
                    });

                    $('<input id="piclink" class="picpath" name="piclink" type="text" placeholder="линк аватарки"><p>').appendTo(info);
                    if (data.pic) {
                        $('#piclink').val(data.pic);
                    }

                } else {
                    $(userdescription).attr('contentEditable', false);
                }
            }
            /* if (data.g) {
             info.html(info.html() + "С нами с " + date.format('dd.mm.yyyy') + userparent + "<p>На этой неделе принес " + data.trx + " треков. Их средний рейтинг: " + data.rt + "<p>Понаприглашал: " + invitestring)
             } else {
             info.html(info.html() + "С нами с " + date.format('dd.mm.yyyy') + userparent + "<p>На этой неделе принесла " + data.trx + " треков. Их средний рейтинг: " + data.rt + "<p>Понаприглашала: " + invitestring)
             }*/
            if (data.g) {
                info.html(info.html() + "С нами с " + date.format('dd.mm.yyyy') + userparent + "<p>Понаприглашал: " + invitestring)
            } else {
                info.html(info.html() + "С нами с " + date.format('dd.mm.yyyy') + userparent + "<p>Понаприглашала: " + invitestring)
            }


            if (data.id != client.user.id) {
                $('<br><label><input type="checkbox" name="muteuser" id="usermute">ОМММ</label>').appendTo(info);
                var muted = $.Storage.get("muteuser" + data.id);
                if (muted) {
                    $('#usermute').attr('checked', 'true');
                }
                $('#usermute').click(function() {
                    var m = $(this).is(':checked');
                    if (m) {
                        $.Storage.set("muteuser" + data.id, 'true');
                        fillUserlist();
                    } else {
                        $.Storage.remove("muteuser" + data.id);
                        fillUserlist();
                    }
                });
                var banbutton = $('<br><div class="banplace"><button>Забанить</button></div>').appendTo(info);
            }


            var tabs = $("<table class ='p_tabs'><tr><td class='tab uploads'><a href='javascript:void(0);'>"+locale.m_uploads+"</a></td><td class='tab positive'><a href='javascript:void(0);'>"+locale.m_pros+"</a></td><td class='tab negative'><a href='javascript:void(0);'>"+locale.m_cons+"</a></td><td class='tab options'><a href='javascript:void(0);'>"+locale.m_options+"</a></td></tr></table>").appendTo(scroller);
            var list = $("<ul class='list'></ul>").appendTo(scroller);

            $('#info .content.profile .p_tabs .tab').bind('click', function() {
                if (!$(this).hasClass('active')) {
                    $('#info .content.profile .p_tabs .tab').removeClass('active').children('a').removeClass('hover');
                    $(this).addClass('active').children('a').addClass('hover');

                    if ($(this).hasClass('options')) {
                        $('#info .content.profile .list').html('<div class="option"><label><input type="checkbox" name="tink" id="tink">'+locale.p_tink+'</label></div><div class="option"><label><input type="checkbox" name="showimg" id="showimg">Показывать картинки</label></div>  <div class="option"><label><input type="checkbox" name="mutetrack" id="mutetrack">Заглушать трек когда я ставлю минус</label></div>   <div class="option"><label><input type="checkbox" name="female" id="female">'+locale.p_woman+'</label></div> <div class="option" id="passchange"><input class="oldpass" type="text" placeholder="Старый пароль"><br><input class="new1" type="password" placeholder="Новый пароль"><br><input class="new2" type="password" placeholder="Еще раз"><br><div class="send"><a href="javascript:passchanger();void(0);">Сменить пароль</a></div><div class="errors"></div> <div id="optionexit"><a href="javascript:logout();void(0);"><img src="/img/exit.png" alt="Эвакуация"></a></div> </div></div>');
                        $('#tink').attr('checked', tink);
                        $('#female').attr('checked', !data.g);
                        $('#showimg').attr('checked', !noimg);
                        $('#mutetrack').attr('checked', mutetrack);

                        $('#mutetrack').click(function() {
                            mutetrack = $(this).is(':checked');
                            setmute();
                        });

                        $('#tink').click(function() {
                            tink = $(this).is(':checked');
                            settink();
                        });
                        $('#female').click(function() {
                            var gender = !$(this).is(':checked');
                            client.updateUserData({
                                g: gender
                            });

                        });
                        $('#showimg').click(function() {
                            noimg = !$(this).is(':checked');
                            setnoimg();
                        });
                        if (data.invites.i) {
                            if (data.invites.i.length) {
                                var invts = $('<div class="option"><div class="toper">Прямо сейчас ты можешь пригласить сюда замечательного человека!</div></div>').appendTo($('#info .content.profile .list'));
                                for (var inv in data.invites.i) {
                                    var form = $("<div class='sendform'><div class='minput'></div></div>").appendTo($('#info .content.profile .list'));
                                    var input = $("<input class='mailinput' id='" + data.invites.i[inv] + "' type='text' placeholder='Email'>").appendTo(form.children('.minput'));
                                    var sender = $("<div class='send'><a href='javascript:void(0);'>Отправить</a></div>").appendTo(form);
                                    $(sender).attr('code', data.invites.i[inv]);
                                    sender.click(function() {
                                        var code = $(this).attr('code');
                                        var todel = $(this).parent();
                                        client.sendinvite($('#' + code).val(), code, function(data) {
                                            if (data.ok) {
                                                $('<div class="message"><p>Твой инвайт ушел на ' + data.m + '</p></div>').appendTo($('#chatmessages'));
                                                $('#info .content.chat .log').animate({scrollTop: $('.log')[0].scrollHeight}, 1200);
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
                    if ($(this).hasClass('uploads')) {
                        $('#info .content.profile .list').html('');
                        client.getUser({'id': id, 'uplshift': 0}, function(data) {

                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                        });
                    }
                    if ($(this).hasClass('positive')) {
                        $('#info .content.profile .list').html('');
                        client.getUser({'id': id, 'uplshift': 0, 'p': true}, function(data) {

                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                        });
                    }
                    if ($(this).hasClass('negative')) {
                        $('#info .content.profile .list').html('');
                        client.getUser({'id': id, 'uplshift': 0, 'p': false}, function(data) {

                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                        });
                    }
                }

            });
            var topline = tabs[0].offsetTop - (tabs.height() + $('#info .content.profile .main').height()) + 5;

            $(scroller).scroll(function() {
                if ($(this).scrollTop() - topline > 0 && !tabs.hasClass('top')) {
                    tabs.addClass('top');
                    $('#info .content.profile .shift').css('height', 60 + tabs.height() + 'px');
                    var profileshift = $('#info .tabs').height() + $('#info .content.profile .main').height() + $('#info .content.profile .p_tabs').height();
                    $('#info .content.profile .inner').height($(window).height() - profileshift);
                }
                if ($(this).scrollTop() - topline < 0 && tabs.hasClass('top')) {
                    tabs.removeClass('top');
                    $('#info .content.profile .shift').css('height', '60px');
                    var profileshift = $('#info .tabs').height() + $('#info .content.profile .main').height();
                    $('#info .content.profile .inner').height($(window).height() - profileshift);
                }

                if ($(this).children('.list').height() - $(this).scrollTop() - $(this).height() < 300 && !historyprocess) {

                    if ($('#info .content.profile .p_tabs .uploads').hasClass('active')) {
                        historyprocess = true;
                        client.getUser({'id': id, 'uplshift': lht}, function(data) {
                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                            historyprocess = false;
                        });
                    }
                    if ($('#info .content.profile .p_tabs .negative').hasClass('active')) {
                        historyprocess = true;
                        client.getUser({'id': id, 'uplshift': lht, 'p': false}, function(data) {
                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                            historyprocess = false;
                        });
                    }
                    if ($('#info .content.profile .p_tabs .positive').hasClass('active')) {
                        historyprocess = true;
                        client.getUser({'id': id, 'uplshift': lht, 'p': true}, function(data) {
                            if (data.length) {
                                for (var t in data) {
                                    addprofile(data[t]);
                                }
                            }
                            historyprocess = false;
                        });
                    }
                }

            });


            if (id != client.user.id) {
                $('#info .p_tabs .options').hide(400);
            } else {
                $('#info .p_tabs .options').show(400);
            }
            $('#info .content .inner').height($(window).height() - $('#info .tabs').height() - $('#info .tabs.profile .main').height());
            $('#info .content.profile .p_tabs .uploads').click();

        });
    }
}
function passchanger() {
    $('#passchange .errors').html('');
    var cur = $('#passchange .oldpass').val();
    var new1 = $('#passchange .new1').val();
    var new2 = $('#passchange .new2').val();
    if (cur.length) {
        if (new1.length > 2) {
            if (new1 == new2) {
                cur = hex_md5(cur);
                new1 = hex_md5(new1);
                client.changepass(cur, new1, function(data) {
                    if (data.ok) {
                        $('#passchange .errors').html('Все получилось! Запомни свой новый пароль ;)');
                        if (remember_name) {
                            $.Storage.set("password", new1);
                        }
                    } else {
                        if (data.e = 'wrong') {
                            $('#passchange .errors').html('Текущий пароль не совпадает');
                        } else {
                            $('#passchange .errors').html('Кажется что-то пошло не так');
                        }
                    }
                });
            } else {
                $('#passchange .errors').html('Новые пароли не совпадают. Попробуй еще раз');
            }
        } else {
            $('#passchange .errors').html('В пароле должно быть хотя бы 3 символа');
        }
    } else {
        $('#passchange .errors').html('Старый пароль все же придется ввести');
    }
}
function addprofile(track) {
    var item = $('<li class="item"></li>').appendTo('#info .content.profile .list');
    var base = $('<div class="base"></div>').appendTo(item);
    var date = moment(track.tt).calendar();
    track.rr = track.p.length - track.n.length;

    base.append('<table><tr><td class="cover"><div class="artwork"><img src="img/nocover.png"></div></td><td class="name"><div class="artist">' + track.a + '</div><div class="title">' + track.t + '</div></td><td class="time">' + date + '</td><td class="rating"><div>' + track.r + '<span class="real">/' + track.rr + '</span></div></td></tr></table>');
    var art = $(base).find('.artwork');
    if (track.g) {
        $(art).css('border', '2px solid #ffcd00');
    } else {
        $(art).css('border', '1px solid #aaa');
    }
    var inf = track.i;
    var full = $('<div class="full"></div>').appendTo(item);
    full.attr('id', track.id);
    var voting = $('<div class="votebar"></div>').appendTo(full);

    var voters = $('<div class="voters"><ul class="nvotes"></ul><ul class="pvotes"></ul></div>').appendTo(voting);
    var positivelist = $(voters).find(".pvotes");
    var negativelist = $(voters).find(".nvotes");
    for (var i in track.n) {
        $('<li><a href="javascript:getuser(' + track.n[i].vid + ');void(0);">' + track.n[i].n + '</a></li>').appendTo(negativelist);
    }
    for (var i in track.p) {
        $('<li><a href="javascript:getuser(' + track.p[i].vid + ');void(0);">' + track.p[i].n + '</a></li>').appendTo(positivelist);
    }

    voters.hide();
    item.click(function() {
        voters.toggle();
    })


    var tags = $('<div class="tags"></div>').appendTo(full);
    var info = $('<div class="info">' + inf + '</div>').appendTo(full);
    full.append('<div class="sender">прнс <a href="javascript:getuser(' + track.sid + ');void(0);">' + track.s + '</a></div>');
    for (var t in track.tg) {
        var tagitem = $('<div class="tag">' + track.tg[t].n + '</div>').appendTo(tags);
        tagitem.attr('tagid', track.tg[t].id);
    }
    var titleURI = encodeURIComponent(track.t).replace('amp%3B', '');
    var artistURI = encodeURIComponent(track.a).replace('amp%3B', '');
    $('<span><a href="http://vk.com/audio?q=' + artistURI + ' - ' + titleURI + '" target="_blank">>vk</a></span>').appendTo(tags);
    $('<span><a href="http://muzebra.com/search/?q=' + encodeURIComponent(track.a) + ' - ' + encodeURIComponent(track.t) + '" target="_blank">>muzebra</a></span>').appendTo(tags);
    $('<span><a href="javascript:addTr(' + track.id + ');void(0);">>в чат</a></span>').appendTo(tags);
    item.addClass('trackid' + track.id);
    lht = new Date(Date.parse(track.tt) + timezone);
    if (client.user) {
        for (var vr in track.p) {
            if (track.p[vr].vid == client.user.id) {
                base.find('.rating div').css('color', '#ffae00');
                break;
            }
        }
        for (var vr in track.n) {
            if (track.n[vr].vid == client.user.id) {
                base.find('.rating div').css('color', '#000000');
                break;
            }
        }
    }
}