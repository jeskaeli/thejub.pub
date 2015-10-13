// Monolothic resizing for the whole page
function refresh_sizes(player_loaded) {
  this.player_loaded = this.player_loaded || player_loaded;
  var main_row_top = $('#jub-row-main').position().top;
  var main_row_height = $(window).height() - main_row_top - 10;
  var main_row_width = $(window).width();
  var player_pos = $('#player').offset();

  //$('#jub-row-main').innerHeight(main_row_height);

  // TODO remove after settling on a chat input location
  //var space_under_chat = parseInt($('#chat-input').css('bottom'), 10) -
  //                   ($(window).height() - $('#bottom-nav').position().top);

  // Chat messages
  var msgs_height = $('#bottom-nav').position().top - main_row_top - 10;
  $('#messages').innerHeight(msgs_height);
  $('#messages').trigger('update_scroll');

  // Chat input width
  // TODO can't get this to work with style sheets alone
  $('#chat-input').outerWidth($('#messages').width());
  $('#chat-input').css({
    'margin-right': parseInt($('#jub-col-chat').css('padding-right'), 10) +
                    parseInt($('#jub-container').css('padding-right'), 10)
  })

  // Set queue height
  $('#video-queue').innerHeight(msgs_height - $('#queue-label').outerHeight());

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

$( window ).resize(function() {
  refresh_sizes();
});

$( document ).ready(function() {
  refresh_sizes();
});