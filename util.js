module.exports = {

  // Call to apply some monkey-patches various classes
  monkey_patch: function() {

    // String.starts_with
    if ( typeof String.prototype.starts_with != 'function' ) {
      String.prototype.starts_with = function( substr ) {
        return this.indexOf(substr) === 0;
      }
    };

  },

  // Recursive object inspection
  inspect: function xinspect(o, i) {
    if (typeof i == 'undefined') i = '';
    if (i.length > 50) return '[MAX ITERATIONS]';
    var r = [];
    for(var p in o) {
      var t = typeof o[p];
      r.push(
        i + p + ' (' + t + '): ' +
        (t == 'object' ? 'object:' + xinspect(o[p], i + '  ') : o[p] + '')
      );
    }
    return r.join(i + '\n');
  }
}
