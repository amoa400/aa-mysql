var aamysql = require('./lib');

// config
aamysql.config({
	host: '127.0.0.1',
  port: 3306,
  user: 'root',
  pass: '',
  prefix: 'ss_',
  db: 'account'
});


var conn = aamysql.create();
conn.connect(function(err) {
	conn.table('account').select(function(err, res){
		console.log(err);
		console.log(res);
	});
});