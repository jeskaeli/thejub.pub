/* Utility functions for the client */

function inspect(o, i) {
  if (typeof i=='undefined')i='';
  if (i.length>50) return '[MAX ITERATIONS]';
  var r = [];
  for(var p in o) {
    var t = typeof o[p];
    r.push(i + p + ' (' + t + '): ' +
           (t == 'object' ? 'object:' + xinspect(o[p], i + '  ') : o[p] + ''));
  }
}

// TODO put this somewhere else or load someone else's cookie fns
function get_cookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}

// monkey-patch String with #starts_with
// TODO don't duplicate this with the server-side version
if ( typeof String.prototype.starts_with != 'function' ) {
  String.prototype.starts_with = function( substr ) {
    return this.indexOf(substr) === 0;
  }
};

