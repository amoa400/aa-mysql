var should = require('should');
var aamysql = require('../lib/index');

// config
aamysql.config({
	host: 'localhost',
	port: 3306,
	user: 'root',
	pass: '',
	prefix: 'aa_',
	db: 'aa-mysql',
	connLimit: 50
});

var pool = aamysql.createPool();

// conn test
describe('query', function() {
	it('field', function(done) {
		pool.table('product').field('name', ['price', false, 'price2']).where({id: 1}).find(function(err, data) {
			data.should.eql({name: 'Nike Air Max 2014 iD', price2: 199});
			pool.table('product').field(['MAX(`price`)', true, 'max_price']).find(function(err, data) {
				data.should.eql({max_price: 299});
				done();
			});
		});
	});

	it('where', function(done) {
		pool.table('product').field('id').where({id: 1}, {id: [5, '<'], price: [100, '<']}, [{id: 5}, {price: 55}, 'OR'], 'OR')
		.select(function(err, data) {
			data.should.eql([{id: 1}, {id: 3}, {id: 4}, {id: 5}, {id: 6}]);
			done();
		});
	});

	it('order', function(done) {
		pool.table('product').field('id').order(['shop_id', 'DESC'], ['id']).limit(5).select(function(err, data) {
			data.should.eql([{id: 6}, {id: 7}, {id: 4}, {id: 5}, {id: 1}]);
			done();
		});
	});

	it('limit', function(done) {
		pool.table('product').field('id').limit(3, 2).select(function(err, data) {
			data.should.eql([{id: 4}, {id: 5}]);
			done();
		});
	});

	it('page', function(done) {
		pool.table('product').field('id').limit(2, 2).select(function(err, data) {
			data.should.eql([{id: 3}, {id: 4}])
			done();
		});
	});

	it('join', function(done) {
		pool.table('product').field(['`aa_product`.`id`', true, 'product_id'], ['`aa_shop`.`id`', true, 'shop_id'], ['`aa_order`.`id`', true, 'order_id'])
		.join(['shop', {'`aa_product`.`shop_id`': ['`aa_shop`.`id`', '=', true, true]}], ['order', {'`aa_product`.`id`': ['`aa_order`.`product_id`', '=', true, true]}])
		.select(function(err, data) {
			data.should.eql(JSON.parse('[{"product_id":1,"shop_id":1,"order_id":1},{"product_id":2,"shop_id":1,"order_id":2},{"product_id":6,"shop_id":3,"order_id":3},{"product_id":3,"shop_id":1,"order_id":4},{"product_id":4,"shop_id":2,"order_id":5},{"product_id":1,"shop_id":1,"order_id":6},{"product_id":5,"shop_id":2,"order_id":7},{"product_id":6,"shop_id":3,"order_id":8},{"product_id":1,"shop_id":1,"order_id":9},{"product_id":2,"shop_id":1,"order_id":10},{"product_id":3,"shop_id":1,"order_id":11},{"product_id":4,"shop_id":2,"order_id":12},{"product_id":5,"shop_id":2,"order_id":13}]'));
			done();
		});
	});

	it('option [explain]', function(done) {
		pool.table('product').option({explain: true}).find(function(err, data) {
			data.rows.should.eql(7);
			done();
		});
	});

	it('option [get]', function(done) {
		var sql = pool.table('product').option({get: true}).find();
		sql.should.eql('SELECT * FROM `aa_product` LIMIT 1;');
		done();
	});

	it('insert', function(done) {
		var title = 'insert ' + parseInt(Math.random() * 10000000);
		var title2 = 'insert ' + parseInt(Math.random() * 10000000);
		pool.table('ad').insert([{title: title}, {title: title2}], function(err, data) {
			data.affectedRows.should.eql(2);
			done();
		});
	});

	it('update', function(done) {
		var title = 'insert ' + parseInt(Math.random() * 10000000);
		pool.table('ad').insert({title: title}, function(err, data) {
			pool.table('ad').where({title: title}).update({title: title.replace('insert', 'update')}, function(err, data) {
				data.affectedRows.should.eql(1);
				done();
			});
		});
	});

	it('delete', function(done) {
		var title = 'insert ' + parseInt(Math.random() * 10000000);
		pool.table('ad').insert({title: title}, function(err, data) {
			pool.table('ad').where({title: title}).delete(function(err, data) {
				data.affectedRows.should.eql(1);
				done();
			});
		});
	});
});
