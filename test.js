var aamysql = require('./lib');
var pool = aamysql.create();

//pool.monitor();

pool.config({pass: '123', db: 'aa-blog', prefix: 'aa_'});

pool.get(function(err,  conn) {
  var query = conn.table('post');
  query = query.field('id').order('id').page(2, 2);
  //query.where({a: 1}, [{b: 1}, {c: 1, d: [1, '>']}, 'OR'], 'OR');
  //query.where([{a: 1}, [{b: 2}, {c: [3, '<']}, 'OR']], {d: 4, 'COUNT(*)': [5, '>', true]}, 'OR');
  query.where({view_count: [100, '>']});
  query.find(function(err, data) {
    console.log(err);
    console.log(data);
  });
  console.log(query.sql);
});

return;

function test() {
  pool.get(function(err, conn) {
    if (err) return;

    var release = function() {
      if (parseInt(Math.random() * 10) != 0)
      pool.release(conn);
    }

    setTimeout(release, Math.random() * 10000)
  });
  setTimeout(test, Math.random() * 1000);
}
test();