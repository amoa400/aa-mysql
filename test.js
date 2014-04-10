var aamysql = require('./lib');
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
  // transaction
  conn.transaction([
    conn.table('test').op({get: 1}).insert({name: '123'}),
    conn.table('test').op({get: 1}).insert({id: 1, name: '456'}),
    conn.table('test').op({get: 1}).insert({name: '555'})
  ], function(err) {
    console.log(err);
  });
  // join
  var on = {'`aa_test`.`id`': ['`aa_test2`.`id`', '=', true, true]};
  conn.table('test').join('test2', on).select(function(err, res) {
    console.log(err, res);
  });
});
