var Conn = require('./conn');
var Pool = require('./pool');
var Query = require('./query');
var mescapeId = require('mysql').escapeId;

// aa-mysql class
var AAMysql = function(conf) {
	// config args
  this.conf = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    pass: '',
    prefix: '',
    db: '',
    connLimit: 20
  }
}
module.exports = new AAMysql();

// config
AAMysql.prototype.config = function(conf) {
	for (var i in conf) {
		this.conf[i] = conf[i];
	}
}

// create a new connection
AAMysql.prototype.create = function() {
	return new Conn(this.conf);
}

// create a new connection pool
AAMysql.prototype.createPool = function() {
  return new Pool(this.conf);
}

// create a query
AAMysql.prototype.createQuery = function(name) {
  var query = new Query();
  query.sql.table = mescapeId(this.conf.prefix + name);
  return query;
}
