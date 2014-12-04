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
var pool = aamysql.createPool();

// delete
var tot = 0;
var done = function() {
	tot++;
	if (tot === 7) {
		var totConn = pool.totConn;
		for (var i = 0; i < totConn; i++) {
			pool.delete(pool.freeConn[0]);
		}
	}
}

// 1 insert
pool.get(function(err, conn) {
	if (err) {
		console.log(err);
		return;
	}

	conn.table('user').insert({name: 'amoa400'}, function(err, res) {
		console.log(res);
		pool.release(conn);
		done();
	});
});

// 2 find
pool.get(function(err, conn) {
	if (err) {
		console.log(err);
		return;
	}

	conn.table('user').where({id: 3}).find(function(err, res) {
		console.log(res);
		pool.release(conn);
		done();
	});
});

// 3 select
pool.table('user').field('id').where({id: [2, '>']}).order(['id', 'DESC']).select(function(err, res) {
	console.log(res);
	done();
});

// 4 update
pool.table('user').where({name: 'amoa400'}).update({name: 'cai0715'}, function(err, res) {
	console.log(res);
	done();
});

// 5 delete
pool.table('user').where({name: 'cai0715'}).delete(function(err, res) {
	console.log(res);
	done();
});

// 6 raw
pool.query('SELECT * FROM `aa_user`', function(err, res) {
	console.log(res);
	done();
});

// 7 complicated query
pool.table('user')
	.field(['`aa_user`.`id`', true, 'user_id'], ['`aa_order`.`id`', true, 'order_id'], 'name', 'product_id')
	.join(['order', {'`aa_user`.`id`': ['`aa_order`.`user_id`', '=', true, true]}])
	.where({product_id: [3, '<']}, {product_id: [4, '>']}, 'OR')
	.order(['user_id', 'DESC'], ['order_id'])
	.page(2, 4)
	.select(function(err, res) {
		console.log(res);
		done();
	});
