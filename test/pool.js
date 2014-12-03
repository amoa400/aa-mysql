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
	connLimit: 20
});

// pool test
describe('pool', function() {
	it('should get a connection', function(done) {
		var pool = aamysql.createPool();
		pool.get(function(err, conn) {
			done(err);
		});
	});

	it('should get a connection [after released]', function(done) {
		var pool = aamysql.createPool();
		pool.conf.connLimit = 1;

		var tot = 0;
		var cb = function() {
			tot++;
			if (tot === 2) {
				done();
			}
		}

		pool.get(function(err, conn) {
			pool.release(conn);
			cb();
		});
		pool.get(function(err, conn) {
			pool.release(conn);
			cb();
		});
	});

	it('should get a connection [after deleted]', function(done) {
		var pool = aamysql.createPool();
		pool.conf.connLimit = 1;

		var tot = 0;
		var cb = function() {
			tot++;
			if (tot === 2) {
				done();
			}
		}

		pool.get(function(err, conn) {
			pool.delete(conn);
			cb();
		});
		pool.get(function(err, conn) {
			pool.delete(conn);
			cb();
		});
	});

	it('should not get a connection', function(done) {
		var pool = aamysql.createPool();
		pool.conf.connLimit = 1;
		pool.get();
		pool.get(function(err, conn) {
			done(new Error('got'));
		});
		setTimeout(function() {
			done();
		}, 500);
	});

	it('should query normally', function(done) {
		var pool = aamysql.createPool();
		pool.query('SELECT * FROM `aa_user` WHERE `id` = 1', function(err, res) {
			if (err) {
				done(err);
			}
			res[0].should.eql({id: 1, name: 'David'});
			done();
		});
	});

	it('should query normally [chain]', function(done) {
		var pool = aamysql.createPool();
		pool.table('user').where({id: 1}).select(function(err, res) {
			if (err) {
				done(err);
			}
			res[0].should.eql({id: 1, name: 'David'});
			done();
		});
	});

	it('should query normally [data object]', function(done) {
		var pool = aamysql.createPool();
		pool.run({
			table: 'user',
			where: [{id: 1}],
			method: 'select'
		}, function(err, res) {
			if (err) {
				done(err);
			}
			res[0].should.eql({id: 1, name: 'David'});
			done();
		});
	});
});
