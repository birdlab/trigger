/**
 * Created by Bird on 08.02.15.
 */
var redactorsettings = {
    linebreaks: false,
    buttons: ['html', 'formatting', 'image', 'link', 'bold', 'italic', 'deleted', 'unorderedlist', 'orderedlist', 'outdent', 'indent', 'alignment']
}


var blogprocess = false;

var firstpostdate = null;
var lastpostdate = null;


$(document).ready(function() {

    $('#info .controlpage.blogs').scroll(function() {
        if (firstpostdate && lastpostdate) {
            if ($(this).children('.list').height() - $(this).scrollTop() - $(this).height() < 300 && !blogprocess) {
                blogprocess = true;
                client.getBlog(function(d) {
                    blogprocess = false;
                    lastpostdate = d[d.length - 1].date;
                    for (var a in d) {
                        addblogpost(d[a]);
                    }
                }, {date: lastpostdate});
            }
        }
    });
});


function addblogpost(post) {

    var kill = '';
    var edit = '';
    var expand = '';
    if (client.user.prch || client.user.opch) {
        kill = ' <br><a href="#" onclick="killpost(' + post.id + '); return false;">[x]</a>';
    }
    if (client.user) {
        if (post.count) {
            expand = ' <a href="#" onclick="openpost(' + post.id + '); return false;"> комментарии (' + post.count + ')</a>';
        } else {
            expand = ' <a href="#" onclick="openpost(' + post.id + '); return false;">комментарии</a>';
        }
    }
    $('<div class="post" id="post' + post.id + '"><div class="cin"><div class="content">' + post.content + '</div><div class="info"> <a href="javascript:post2chat(' + post.id + ');void(0);">#' + post.id + '</a> написал <a href="javascript:getuser(' + post.senderid + ');void(0);">' + post.name + '</a> ' + moment(post.date).calendar() + expand + kill + '</div></div><div class="comments"></div></div>').appendTo('#info .controlpage.blogs .list');
}

function addCommentEditor(postid, commentid) {
    $('#commentform').remove();
    var place = $('#post' + postid).children('.comments').first();
    if (commentid) {
        place = $('#comment' + commentid).children('.comments').first();
    }
    $('<form action="" id="commentform" method="post"><textarea id="commenteditor" name="content"></textarea><div class="button">Пст</div></p></form>').appendTo(place);
    $('#commenteditor').redactor(redactorsettings);
    $('#commentform .button').click(function() {
        console.log($('#commenteditor').redactor('code.get')[0].value);
        client.addComment({
            'content': $('#commenteditor').redactor('code.get')[0].value,
            'postid': postid,
            'parentid': commentid
        }, function(d) {
            if (!d.error) {
                openpost(postid);
            } else {
                console.log(d);
            }
        });
    });
}
function placeComment(comment) {
    var place = $('#post' + comment.postid).children('.comments').first();
    var expand = ' <a href="#" onclick="addCommentEditor(' + comment.postid + ',' + comment.id + '); return false;">ответить</a>'
    if (comment.parentid) {
        place = $('#comment' + comment.parentid).children('.comments').first();

    }
    $('<div class="comment" id="comment' + comment.id + '"><div class="content">' + comment.content + '</div><div class="info">написал <a href="javascript:getuser(' + comment.senderid + ');void(0);">' + comment.name + '</a> ' + moment(comment.date).calendar() + ' #' + comment.id + expand + '</div><div class="comments"></div></div>').appendTo(place);


}

function openpost(postid) {
    console.log(location.hash);
    if (location.hash != '#!/blog/' + postid) {
        // location.hash = '#!/blog/' + postid;
    }
    $('#info .content .post .comments').html('');


    client.getComments({id: postid}, function(d) {
        if (d.length) {
            for (var c in d) {
                placeComment(d[c]);
            }

            var place = $('#post' + postid).children('.comments').first();
            var add = $('<div id="buttoncontainer"></div>').appendTo(place)
            $('<div id="newcomment" class="button">Комментировать</div>').appendTo(add);
            $('#newcomment').click(function() {
                $('#buttoncontainer').remove();
                addCommentEditor(postid);
            });

        } else {
            $('<div class="advice">Возможно ты будешь первым</div>').appendTo('#post' + postid + ' .comments');
            addCommentEditor(postid);
        }
    });

}


function killpost(id) {
    client.killPost(id, function(d) {
        if (!d.error) {
            client.getBlog(fillblog);
        } else {
            console.log(d.error);
        }
    })
}


function fillblog(d) {


    blogprocess = false;
    $('#info .controlpage').hide();
    $('#info .controlpage.blogs .list').html('');
    $('#info .controlpage.blogs').show();


    var blogtop = $('#blogtop');
    $('#newpost').click(function() {
        blogtop.html('<form action="" id="postform" method="post"><textarea id="contenteditor" name="content"></textarea><div class="button">Пст</div></p></form>');
        $('#contenteditor').redactor(redactorsettings);

        $('#postform .button').click(function() {
            console.log($('#contenteditor').redactor('code.get')[0].value);
            client.addPost({content: $('#contenteditor').redactor('code.get')[0].value}, function(d) {
                blogtop.html('<div id="newpost" class="button">Новый пост</div>');
                blogprocess = true;
                client.getBlog(fillblog);
            });
        });

    });

    firstpostdate = d[0].date;
    lastpostdate = d[d.length - 1].date;

    for (var a in d) {
        addblogpost(d[a]);
    }
    if (d.length == 1) {
        openpost(d[0].id);
    }
    if (location.hash.length) {
        var dec = location.hash.split('/')
        if (dec[1] == 'blog' && dec.length > 2) {
            client.getPost(function(data) {
                addblogpost(data[0]);
                openpost(data[0].id);
            }, dec[2]);
        }
    }


    onresize();
}