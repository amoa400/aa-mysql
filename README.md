[![aa-mysql Logo](http://cdn.amoa400.com/github/aa-mysql.small.png)](https://github.com/amoa400/aa-mysql)  
A simple and flexible MySql library for [node](http://nodejs.org).  

[![NPM Version](https://img.shields.io/npm/v/aa-mysql.svg?style=flat-square)](https://www.npmjs.org/package/aa-mysql)&nbsp;&nbsp;[![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D_0.6-brightgreen.svg?style=flat-square)](http://nodejs.org/download/)


***

### Installation
```bash
$ npm install aa-mysql
```

### Usage
```js
// insert amoa400
conn.table('user').insert({name: 'amoa400'});

// find amoa400
conn.table('user').where({name: 'amoa400'}).find();

// rename amoa400 to cai0715
conn.table('user').where({name: 'amoa400'}).update({name: 'cai0715'});

// delete cai0715
conn.table('user').where({name: 'cai0715'}).delete();

// select users whose id is less than 2 or greater than 3, limit 10
conn.table('user').where({id: [2, '<']}, {id: [3, '>']}, 'OR').limit(10).select();
```

### Example
```js
var aamysql = require('aa-mysql');

// config
aamysql.config({
  host: 'localhost',
  port: 3306,
  user: 'root',
  pass: '',
  prefix: 'aa_',
  db: 'aa-mysql',
  connLimit: 20,
  deadTime: 30
});

// use single connection to query
// you can also use connection pool, and it is recommended
var conn = aamysql.create();
conn.connect(function(err) {
  if (err) {
    console.log(err);
    return;
  }

  // select
  conn.table('user').select(function(err, res) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(res);
  });
  
  // transaction
  conn.transaction([
    conn.table('user').op({get: 1}).insert({name: 'amoa400'}),
    conn.table('user').op({get: 1}).insert({id: 'hi', name: 'cai0715'})
    // will cause rollback, because id must be number
  ], function(err, res) {
    if (err) {
      console.log(err);
      return;
    }
    console.log(res);
  }
  });
});
```

### Docs
  
  * top-level (TODO)
  * conn (TODO)
  * query (TODO)
  * pool (TODO)