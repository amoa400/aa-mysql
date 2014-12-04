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

// conn test
describe('conn', function() {
	it('should connect to database', function(done) {
		var conn = aamysql.create();
		conn.connect(function(err) {
			conn.close();
			done(err);
		});
	});

	it('should query normally', function(done) {
		var conn = aamysql.create();
		conn.connect(function(err) {
			conn.query('SELECT * FROM `aa_user` WHERE `id` = 1', function(err, res) {
				if (err) {
					done(err);
				}
				res[0].should.eql({id: 1, name: 'David'});
				done();
			});
		});
	});

	it('should query normally [chain]', function(done) {
		var conn = aamysql.create();
		conn.connect(function(err) {
			conn.table('user').where({id: 1}).select(function(err, res) {
				if (err) {
					done(err);
				}
				res[0].should.eql({id: 1, name: 'David'});
				done();
			});
		});
	});

	it('should commit the transaction', function(done) {
		var conn = aamysql.create();
		conn.connect(function(err) {
			conn.transaction([
				'INSERT INTO `aa_ad`(`title`) VALUES(\'NIKE 5% off\')',
				'INSERT INTO `aa_ad`(`title`) VALUES(\'NIKE 6% off\')'
			], function(err, res) {
				res[0].affectedRows.should.eql(1);
				res[1].affectedRows.should.eql(1);
				done(err);
			});
		});
	});

	it('should rollback the transaction', function(done) {
		var conn = aamysql.create();
		conn.connect(function(err) {
			conn.transaction([
				'INSERT INTO `aa_ad`(`title`) VALUES(\'ADIDAS 0% off\')',
				'INSERT INTO `aa_ad`(`id`, `title`) VALUES(\'ok\', \'NIKE 6% off\')'
			], function(err, res) {
				if (err) {
					done();
				} else {
					done(new Error('should rollback'));
				}
			});
		});
	});
});