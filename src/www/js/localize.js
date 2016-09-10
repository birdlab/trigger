/**
 * Created by Bird on 31.03.16.
 */

var translate = {
    'ru': {
        l_listen: 'Слушают',
        l_active: ' из них активно:',

        c_reformal: 'Уголок потребителя',


        canupload: 'Ты можешь залить ',


        mk_day: 'Сделать день',
        mk_night: 'Сделать ночь',

        ttupload: 'Самое время нести!',

        ch_here: 'Здесь:',

        chat_placeholder:'начинай вводить...',

        m_chat: 'Чат',
        m_history: 'История',
        m_controls: 'ЦУП',
        m_profile: 'Профиль',
        m_blog: 'Блог',
        m_democracy: 'Демократия',
        m_uploads: 'Загрузки',
        m_pros: 'Плюсы',
        m_cons: 'Минусы',
        m_options: 'Подводные камни',
        p_woman:"Ура! Я женщина!",
        p_tink:'Тинькать когда мне приходит сообщение'
    },

    'en': {
        l_listen: 'Total listeners:',
        l_active: ' active:',

        c_reformal: 'Complaints and suggestions',

        canupload: 'You can upload ',


        mk_day: 'Make day',
        mk_night: 'Make night',

        ttupload: "Upload's time!",

        ch_here: 'Here:',

        chat_placeholder:'start typing here',

        m_chat: 'Chat',
        m_history: 'History',
        m_controls: 'NASA',
        m_profile: 'Profile',
        m_blog: 'Blog',
        m_democracy: 'Democracy',
        m_uploads: 'Uploads',
        m_pros: 'Likes',
        m_cons: 'Dislikes',
        m_options: 'Options',

        p_woman:"Fuckyeah! I'm a woman!",
        p_tink:'Tink when message is recieved'
    }
}


lang = 'ru';
locale = translate[lang];


function switch_lang(l) {
    console.log(l);
    if (lang != l) {
        lang = l;
        $.Storage.set("lang", lang);
        location.reload();
    } else {
        console.log(l);
        locale = translate[lang];
        moment.lang(lang);
        var buttonstring = '<a href=\'#\' onclick="switch_lang(\'en\');return false;">Translate this!</a>';
        if (lang == 'en') {
            buttonstring = '<a href=\'#\' onclick="switch_lang(\'ru\');return false;">Переведите это!</a>';
        }
        $('#langswitch').html(buttonstring);


        $('#info .tabs .chat a').html(locale.m_chat);
        $('#info .tabs .channels a').html(locale.m_controls);
        $('#info .tabs .history a').html(locale.m_history);
        $('#info .tabs .profile a').html(locale.m_profile);
        $('#info .content .p_tabs .blog a').html(locale.m_blog);
        $('#info .content .p_tabs .democracy a').html(locale.m_democracy);
        $('.reformal_link a').html(locale.c_reformal);
        $('#messageinput').attr("placeholder", locale.chat_placeholder);


    }
}
