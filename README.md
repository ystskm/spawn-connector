# spawn-connector

[![Version](https://badge.fury.io/js/spawn-connector.png)](https://npmjs.org/package/spawn-connector)
[![Build status](https://travis-ci.org/ystskm/spawn-connector.png)](https://travis-ci.org/ystskm/spawn-connector)  

## Install

Install with [npm](http://npmjs.org/):

    npm install spawn-connector
    
## API - Wakeup connector and write command

```js
    var sc = require('spawn-connector')('/bin/sh');
    Promise.resolve().then(()=>c.write('echo "FOONYAH"')).then(s=>console.log(s.stdout[0])).then(()=>c.close());
    // => Gets "FOONYAH" on console
```
```js
    var sc = require('spawn-connector')('mongo');
    Promise.resolve().then(()=>c.write('show dbs')).then(s=>console.log(s.stdout)).then(()=>c.close());
    // => Gets array of database names + session closed message
```
