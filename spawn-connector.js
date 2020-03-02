/**
 * SpawnConnector
 * A simple API for any command-line-based script
 @usage
 var sc = require('./spawn-connector.js')(path-to-mongo);
 Promise.resolve().then(()=>sc.write('show dbs')).then(s=>console.log(s.stdout)).then(()=>sc.close());
 // => Array of database names + session closed message
 Promise.resolve().then(()=>sc.open()).then(()=>c.write('show dbs')).then(s=>console.log(s.stdout)).then(()=>sc.close());
 // => re-open: Array of database names + session closed message
 *
 **/
(function(g) {
  
  var NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
  var os = require('os'), EOL = os.EOL;
  var fs = require('fs'), cp = require('child_process');
  var util = require('util');
  var Emitter = require('events').EventEmitter, stream = require('stream');
  if(typeof Promise == 'undefined') global.Promise = require('es6-promise').Promise;
  
  var sc_protos = {
    open: open, 
    connected: connected,
    flush: flush,
    write: write, 
    close: close
  };
  var SpawnConnector = module.exports = function(cmd, options) {
    if(!(this instanceof SpawnConnector)) {
      return new SpawnConnector(cmd, options);
    }
    var sc = this, sess;
    Emitter.call(sc);
    if(options == NULL) options = { };
    // options
    // <Array> args [ ]
    // <Number> message_interval 320
    // <Boolean> string
    if(options.args == NULL) options.args = [ ];
    if(options.message_interval == NULL) options.message_interval = 320;
    if(options.bufferValue == NULL) options.bufferValue = buf=>buf.toString().split(EOL).filter(t=>!!t);
    sc.options = options;
    sc.cmd = cmd || '/Users/ystk_skm/database/mongodb/bin/mongo';
    sc.promise = Promise.resolve();
    sc.open();
  }
  util.inherits(SpawnConnector, Emitter);
  each(sc_protos, (k, func)=>SpawnConnector.prototype[k] = func);
  // <-- END_OF_MAIN <--
  
  /**
   * @sync
   */
  function flush() {
    var sc = this, sc_opts = sc.options, sess = sc.session;
    var OLD = sc.stack;
    sc.stack = {
      output: 0,
      outlen: 0,
      outsec: 0,
      stdout: Buffer.alloc(0),
      stderr: Buffer.alloc(0),
    };
    return OLD;
  }
  
  /**
   * @sync
   */
  function connected() {
    var sc = this, sc_opts = sc.options, sess = sc.session;
    return sess ? sess.stdin.writable && sess.stdout.readable: NULL;
  }
  
  /**
   * @async
   */
  function open() {
    var sc = this, sc_opts = sc.options, sess = sc.session;
    var no = open.no = (open.no || 0) + 1;
    return new Promise((rsl, rej)=>{
      
      sess = sc.session = cp.spawn(sc.cmd, sc_opts.args, {
        stdio: [ 'pipe', 'pipe', 'pipe' ]
      });
      sc.stdout = sess.stdout.on('data', outHandle = buf=>{
        var s = sc.stack;
        var n = s.output += 1;
        s.outsec = Date.now();
        s.outlen += buf.length;
        s.stdout = Buffer.concat([ s.stdout, buf ]);
        setTimeout(()=>{
          if(n == s.output) sc.emit('resolve');
        }, sc_opts.message_interval);
      });
      sc.stderr = sess.stderr.on('data', errHandle = buf=>{
        var s = sc.stack;
        var n = s.output += 1;
        s.outsec = Date.now();
        s.outlen += buf.length;
        s.stderr = Buffer.concat([ s.stderr, buf ]);
        setTimeout(()=>{
          if(n == s.output) sc.emit('resolve');
        }, sc_opts.message_interval);
      });
      sess.on('error', function(e) {
        outLog('SESSION ERROR NO.' + no, e);
        sess.ERROR = e, sess.ERRORED = new Date();
        sc.stdout.removeListener('data', outHandle);
        sc.stderr.removeListener('data', errHandle);
        rej(e);
        sc.emit('error');
      });
      sess.on('close', function(e) {
        outLog('SESSION CLOSED NO.' + no);
        sess.ENDED = new Date();
        sc.stdout.removeListener('data', outHandle);
        sc.stderr.removeListener('data', errHandle);
        sc.emit('close');
      });
      sc.write(EOL).then(rsl, rej);
      
    });
  }
  
  /**
   * @async
   */
  function write(sql, sec, bufferValue) {
    var sc = this, sc_opts = sc.options, sess = sc.session;
    sc.flush();
    var p;
    p = sc.promise = sc.promise.then(()=>Promise.resolve().then(()=>{
      return new Promise((rsl, rej)=>{

        var s = sc.stack;
        var resolve = ()=>{
          try {
            if(bufferValue === FALSE) {
              bufferValue = buf=>buf;
            } else if(sc_opts.bufferValue) {
              bufferValue = sc_opts.bufferValue;
            }
            s.stdout = isFunction(bufferValue) ? bufferValue(s.stdout): s.stdout;
            s.stderr = isFunction(bufferValue) ? bufferValue(s.stderr): s.stderr;
            rsl(s);
          } catch(e) {
            rej(e);
          }
        };
        sc.once('resolve', ()=>{
          resolve();
        });
        setTimeout(()=>{
          if(s.output == 0) {
            return resolve(); // No message command
          }
          rej('Timeout to execute: '+ sql);
        }, (sec || 3) * 1000)
        sess.stdin.write(sql + EOL);
        
      });
    }));
    sc.promise = sc.promise['catch'](e=>{
      outLog('WRITE ERROR:', e);
    });
    return p;
  }
  
  /**
   * @async
   */
  function close() {
    var sc = this, sc_opts = sc.options, sess = sc.session;
    if(!sess) return FALSE;
    return sess.kill();
  }
  
  // ----- //
  function outLog() {
    var a = Array.prototype.slice.call(arguments);
    a.unshift(new Date().toGMTString() + ' - [SpawnConnector]');
    console.log.apply(console, a);
  }
  
  // ----- //
  function each(x, func) {
    var r;
    Object.keys(x).forEach(xk=>r = func(xk, x[xk]));
    return r;
  }
  function is(ty, x) {
    return typeof x == ty;
  }
  function isFunction(x) {
    return is('function', x);
  }
  function isArray(x) {
    return Array.isArray(x);
  }

})(this);
