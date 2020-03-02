/***/
var NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
var nodeunit = require('foonyah-ci');
process.env.NODE_ENV = 'production';

var db, testee, main = [];
module.exports = nodeunit.testCase({
  'funcs': function(t) {
    
    var sc = require('../spawn-connector.js')('/bin/sh');
    main.push( Promise.resolve()
      .then(()=>sc.promise) // wait for open completion
      .then(()=>funcs().forEach(nm=>t.eq(typeof sc[nm], 'function')))
      .then(s=>t.eq(sc.connected(), TRUE))
      .then(()=>{ sc.close(); return new Promise(rsl=>sc.once('close', rsl)); }) // need some ticks to completely closed
      .then(s=>t.eq(sc.connected(), FALSE))
      .then(t.done)['catch'](t.fail) );
    
  },
  'simple': function(t) {
    
    var sc = require('../spawn-connector.js')('/bin/sh');
    main.push( Promise.resolve()
      .then(()=>sc.promise) // wait for open completion
      .then(()=>sc.write('echo "HOGE"'))
      .then(s=>t.eq(s.stdout[0], 'HOGE'))
      .then(()=>{ sc.close(); return new Promise(rsl=>sc.once('close', rsl)); }) // need some ticks to completely closed
      .then(s=>t.eq(sc.connected(), FALSE))
      .then(t.done)['catch'](t.fail) );
    
  },
  'finalize': function(t) {

    // exit after 1 sec from the end.
    Promise.all(main).then(()=>setTimeout(t.done, 1000));

  }
}, 'sc_basic.js');

function funcs() {
  return ['open', 'connected', 'flush', 'write', 'close'];
}
