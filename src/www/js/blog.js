/**
 * Created by Bird on 08.02.15.
 */
var redactorsettings = {
    linebreaks: false,
    buttons: ['html', 'formatting', 'image', 'link', 'bold', 'italic', 'deleted', 'unorderedlist', 'orderedlist', 'outdent', 'indent', 'alignment']
}


function addblogpost(post) {
    var kill = '';
    var edit = '';
    var expand = '';
    if (client.user.prch || client.user.opch) {
        kill = ' <br><a href="#" onclick="killpost(' + post.id + '); return false;">[x]</a>';
    }
    if (client.user) {
        if (post.comments) {
            expand = ' <a href="#" onclick="openpost(' + post.id + '); return false;"> ' + post.comments + ' комментариев</a>';
        } else {
            expand = ' <a href="#" onclick="openpost(' + post.id + '); return false;">комментарии</a>';
        }
    }
    $('<div class="post" id="post' + post.id + '"><div class="cin"><div class="content">' + post.content + '</div><div class="info">написал <a href="javascript:getuser(' + post.senderid + ');void(0);">' + post.name + '</a> ' + post.date + ' #' + post.id + expand + kill + '</div></div><div class="comments"></div></div>').appendTo('#info .content.channels .list');
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
    $('<div class="comment" id="comment' + comment.id + '"><div class="content">' + comment.content + '</div><div class="info">написал <a href="javascript:getuser(' + comment.senderid + ');void(0);">' + comment.name + '</a> ' + comment.date + ' #' + comment.id + expand + '</div><div class="comments"></div></div>').appendTo(place);


}

function openpost(postid) {
    $('#info .content .post .comments').html('');
    client.getComments({id: postid}, function(d) {
        console.log(d);
        if (d.length) {
            for (var c in d) {
                placeComment(d[c]);
            }

            var place = $('#post' + postid).children('.comments').first();
            var add=$('<div id="buttoncontainer"></div>').appendTo(place)
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
    console.log('blog data - ', d);
    $('#info .content.channels .list').html('');
    $('#info .content.channels').show();
    var blogtop = $('<div id="blogtop"><div id="newpost" class="button">Новый пост</div></div>').appendTo($('#info .content.channels .list'));
    $('#newpost').click(function() {


        blogtop.html('<form action="" id="postform" method="post"><textarea id="contenteditor" name="content"></textarea><div class="button">Пст</div></p></form>');
        $('#contenteditor').redactor(redactorsettings);

        $('#postform .button').click(function() {
            console.log($('#contenteditor').redactor('code.get')[0].value);
            client.addPost({content: $('#contenteditor').redactor('code.get')[0].value}, function(d) {
                console.log(d);
                client.getBlog(fillblog);
            });
        });

    });
    for (var a in d) {
        addblogpost(d[a]);
    }
    onresize();
}