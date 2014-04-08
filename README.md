aa-mysql
=========

a simple and flexible MySql library for Node.js

**homepage:** [https://github.com/amoa400/aa-mysql](https://github.com/amoa400/aa-mysql)

***

### install
    npm install aa-mysql

### simple usage

    var aamysql = require('aa-mysql');
    var pool = aamysql.create();

    // config
    pool.config({
      host: 'localhost',
      port: 3306,
      user: 'root',
      pass: '123',
      prefix: 'aa_',
      db: 'aa-blog',
      connLimit: 20,
      deadTime: 30
    });

    // get conection
    pool.get(function(err, conn) {
      // insert
      conn.table('post').insert({alias: 'hello', title: 'hello, w0rld!', content: 'aha~~~'});
      // update
      conn.table('post').where({alias: 'hello'}).update({title: 'hello, world!'});
      // select
      conn.table('post').where({alias: 'hello'}).select();
      // delete
      conn.table('post').where({alias: 'hello'}).delete();
    });


