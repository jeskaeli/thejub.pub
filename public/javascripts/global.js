// This is for things that *affect* some set of elements or state in any of the
// other files. User lib/ for code that views commonly depend on

// For all buttons, do not keep focus on clicks
$('.btn').on('click', function(e) {
  this.blur();
});

socket.on('force reload', function(obj) {
  console.log('force reload')
  location.reload();
});
