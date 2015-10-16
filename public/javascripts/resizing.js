// Monolothic resizing for the whole page
function refresh_sizes(player_loaded) {
  this.player_loaded = this.player_loaded || player_loaded;
  var main_row_top = $('#jub-row-main').position().top;
  var main_row_height = $(window).height() - main_row_top - 10;
  var main_row_width = $(window).width();
  var player_pos = $('#player').offset();

  // Chat messages
  var chat_tabs_bottom = $('#chat-navtabs').offset().top + $('#chat-navtabs').height();
  var msgs_height = $('#bottom-nav').position().top - chat_tabs_bottom - 10;
  $('#messages').innerHeight(msgs_height);
  $('#messages').trigger('update_scroll');

  // Chat input width
  $('#chat-input').outerWidth($('#chat-tab-content').width());
  $('#chat-input').css({
    'margin-right': parseInt($('#jub-col-chat').css('padding-right'), 10) +
                    parseInt($('#jub-container').css('padding-right'), 10)
  })

  // Set queue height
  $('#video-queue').innerHeight(msgs_height - $('#queue-label').outerHeight());
  $('#video-queue').trigger('redraw_items');

  // Justify jubbin list with player
  // TODO we wait till the player is loaded because the jump to justify
  // against it is noticeable (the player takes a second to load). Once
  // we find a final location for this list, this can probably go away.
  if (!this.player_loaded) {
    $('#jubbin-list-div').hide();
  } else {
    $('#jubbin-list-div').show();
    $('#jubbin-list-div').css({
      'position': 'fixed',
      'left': '' + player_pos.left + 'px',
    });
  }
}

// Wait until some short period of time has passed after the user stops
// resizing, because while they're doing it we get a flood of events
var resize_timer;
$( window ).resize(function() {
  if (resize_timer) {
    window.clearTimeout(resize_timer)
  }
  resize_timer = window.setTimeout(refresh_sizes, 50);
});

$( document ).ready(function() {
  refresh_sizes();
});
