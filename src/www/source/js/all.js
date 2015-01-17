(function($) {
  $(function() {

    $(document).ready(function () {

      /** Global **/
      function getWindowHeight() {
        var windowHeight = $(window).height();
        return windowHeight;
      }

      /**
       * Upload-list resize
       */
      function uploadListResize(windowHeight) {
        var consoleTopHeight = $('#consoleTop').outerHeight(),
            uploadBoxHeight = 60,
            bottomBoxHeight = 27;

        uploadListHeight = windowHeight - consoleTopHeight - uploadBoxHeight - bottomBoxHeight;
        $('#uploadList').css({'height': uploadListHeight});
        console.log('Upload list resized');
      }

      /**
       * Playlist resize
       */
      function playlistResize(windowHeight) {
        var currentHeight = $('.playlist__current').outerHeight(),
            playlistHeight = windowHeight - currentHeight;
        $('.playlist__all').css({'height': playlistHeight});
        console.log('Playist resized');
      }

      $(window).on('resize', function() {
        uploadListResize(getWindowHeight());
        playlistResize(getWindowHeight());
      });
      uploadListResize(getWindowHeight());
      playlistResize(getWindowHeight());


      /**
       * Track toggle animation
       */
      var full = $('.full-info');
      var easing = 'easeOutExpo';
      $("#playlist .track").on('click', function() {
        var elem = $(this).find(full);
        if (!elem.hasClass('expanded')) {
          $(full)
            .hide(200)
            .removeClass('expanded');
          $(elem)
            .stop()
            .slideToggle('400', easing)
            .addClass('expanded');
        } else {
          $(elem)
            .stop()
            .slideToggle('400', easing)
            .removeClass('expanded');
        }
      });

$('.splitter').on('click', function() {
  if (!$(this).hasClass('active')) {
    $('#splitter').jqxSplitter({ showSplitBar: true });
    $('#splitter2').jqxSplitter({ showSplitBar: true });
    $(this).addClass('active');
  } else {
    $('#splitter').jqxSplitter({ showSplitBar: false });
    $('#splitter2').jqxSplitter({ showSplitBar: false });
    $(this).removeClass('active');
  }

});
      /* enable splitter */


      /**
       * Splitter 1: Console vs. Other
       */
      var sp2 = false;
      var spltrSize1 = $.cookie('jqxSplitter_splitter');
      if (undefined == spltrSize1) spltrSize1 = '18%';
      $('#splitter').jqxSplitter({
        width: '100%',
        height: 'auto',
        splitBarSize: 2,
        showSplitBar: false,
        panels: [
          { size: spltrSize1, min: 86 },
          { min: '78%' }
        ]
      }).on('resize', function (event) {
        var panel1 = event.args.panels;
        if (sp2 != true) {
          $.cookie('jqxSplitter_splitter', panel1[0].size, { expires: 7, path: '/' });
          sp2 = false;
        }
      });


      /**
       * Splitter 2: Playlist vs. Content
       */
      var spltrSize2 = $.cookie('jqxSplitter_splitter2');
      if (undefined == spltrSize2) spltrSize2 = '45%';
      $('#splitter2').jqxSplitter({
        width: '100%',
        height: 'auto',
        splitBarSize: 2,
        showSplitBar: false,
        panels: [
          { size: spltrSize2, min: '35%' },
          { min: '35%', collapsible: false }
        ]
      }).on('resize', function (event) {
        var panel2 = event.args.panels;
        $.cookie('jqxSplitter_splitter2', panel2[0].size, { expires: 7, path: '/' });
        sp2 = true;
      });

      /**
       * Tabs
       */
      $('#tabs').tabify();

    }); /** #end documet.ready **/

  });
})(jQuery);



















  /**
   * Console toggle
   */


  // $("#toggleConsoleBut").on('click', function() {

  //   console.log((getWindowWidth() - 86) * (getPlaylistDelta() / 100));

  //   if ( !$('#console').hasClass('mini') ) {
  //     $('#console')
  //       .stop()
  //       .animate({'width':'86px'})
  //       .addClass('mini');
  //     $('#splitter')
  //       .stop()
  //       .animate({
  //         'width': getWindowWidth() - 86,
  //         'margin-left': 86
  //       });
  //     $('#content')
  //       .stop()
  //       .animate({
  //         'left': ((getWindowWidth() - 86) * (getPlaylistDelta() / 100)) + 4
  //       });
  //     $('.jqx-splitter-splitbar-vertical')
  //       .stop()
  //       .animate({
  //         'left': (getWindowWidth() - 86 ) * (getPlaylistDelta() / 100)
  //       });
  //     $(this).find('i')
  //       .removeClass('fa-toggle-on')
  //       .addClass('fa-toggle-off');
  //   } else {
  //     $('#console')
  //       .stop()
  //       .animate({'width': '18%'})
  //       .removeClass('mini');
  //     $('#splitter')
  //       .animate({
  //         'width': '82%',
  //         'margin-left':'18%'
  //       });
  //     $('#content')
  //       .stop()
  //       .animate({
  //         'left': Math.round(getWindowWidth() * 0.82) * (getPlaylistDelta() / 100) + 4
  //       });
  //     $('.jqx-splitter-splitbar-vertical')
  //       .stop()
  //       .animate({
  //         'left': Math.round(getWindowWidth() * 0.82 ) * (getPlaylistDelta() / 100)
  //       });
  //     $(this).find('i')
  //       .removeClass('fa-toggle-off')
  //       .addClass('fa-toggle-on');
  //   }
  // });
