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
  if (parts.length == 2)
    return parts.pop().split(";").shift();
  else
    return null;
}

function set_cookie(name, value) {
  var expiration_date = new Date();
  expiration_date.setFullYear(expiration_date.getFullYear() + 1);
  document.cookie = name + '=' + value + '; ' +
                    'expires=' + expiration_date.toGMTString();
}

// monkey-patch String with #starts_with
// TODO don't duplicate this with the server-side version
if ( typeof String.prototype.starts_with != 'function' ) {
  String.prototype.starts_with = function( substr ) {
    return this.indexOf(substr) === 0;
  }
};

// Memoized scrollbar width
function scrollbar_width() {
  if (this.value)
    return this.value;

  var inner = document.createElement('p');
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement('div');
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild (inner);

  document.body.appendChild (outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild (outer);

  this.value = (w1 - w2);
  return this.value;
};

var socket = io();
