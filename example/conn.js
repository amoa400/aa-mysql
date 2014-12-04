var aamysql = require('../lib/index');

// config
aamysql.config({
	host: 'localhost',
	port: 3306,
	user: 'root',
	pass: '',
	prefix: 'aa_',
	db: 'aa-mysql',
	connLimit: 20
});

// conn
var conn = aamysql.create();

// connect
conn.connect(function(err) {
	if (err) {
		console.log(err);
		return;
	}

	// close
	var tot = 0;
	var done = function() {
		tot++;
		if (tot === 7) {
			conn.close();
		}
	}

	// 1 insert
	conn.table('user').insert({name: 'amoa400'}, function(err, res) {
		console.log(res);
		done();
	});

	// 2 find
	conn.table('user').where({id: 3}).find(function(err, res) {
		console.log(res);
		done();
	});

	// 3 select
	conn.table('user').field('id').where({id: [2, '>']}).order(['id', 'DESC']).select(function(err, res) {
		console.log(res);
		done();
	});

	// 4 update
	conn.table('user').where({name: 'amoa400'}).update({name: 'cai0715'}, function(err, res) {
		console.log(res);
		done();
	});

	// 5 delete
	conn.table('user').where({name: 'cai0715'}).delete(function(err, res) {
		console.log(res);
		done();
	});

	// 6 raw
	conn.query('SELECT * FROM `aa_user`', function(err, res) {
		console.log(res);
		done();
	});

	// 7 complicated query
	conn.table('user')
		.field(['`aa_user`.`id`', true, 'user_id'], ['`aa_order`.`id`', true, 'order_id'], 'name', 'product_id')
		.join(['order', {'`aa_user`.`id`': ['`aa_order`.`user_id`', '=', true, true]}])
		.where({product_id: [3, '<']}, {product_id: [4, '>']}, 'OR')
		.order(['user_id', 'DESC'], ['order_id'])
		.page(2, 4)
		.select(function(err, res) {
			console.log(res);
			done();
		});
});

// conn2 for transaction commit
var conn2 = aamysql.create();

// connect
conn2.connect(function(err) {
	if (err) {
		console.log(err);
		return;
	}

	// transaction commit
	conn2.transaction([
    conn2.table('user').option({get: true}).insert({name: 'a'}),
    conn2.table('user').option({get: true}).insert({name: 'b'})
  ], function(err, res) {
  	console.log(res);
  	conn2.close();
  });
});

// conn3 for transaction rollback
var conn3 = aamysql.create();

// connect
conn3.connect(function(err) {
	if (err) {
		console.log(err);
		return;
	}

 	// transaction rollback
	conn3.transaction([
    conn3.table('user').option({get: true}).insert({name: 'a'}),
    conn3.table('user').option({get: true}).insert({id:'c', name: 'b'})
  ], function(err, res) {
  	console.log(res);
  	conn3.close();
  });
});
