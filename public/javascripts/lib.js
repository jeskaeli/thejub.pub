/* Utility functions for the client */

function xinspect(o, i) {
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

