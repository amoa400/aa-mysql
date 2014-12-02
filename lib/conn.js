var debug = require('debug')('conn');
var util = require('util');
var events = require('events');
var mysql = require('mysql');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;
var AAQuery = require('./query');

// connection class
var AAconn = module.exports = function(conf) {
  this.conf = conf;
  this.conn = {};
  this.id = parseInt(Math.random() * 10e6);
}
util.inherits(AAconn, events.EventEmitter);

// connect to database
AAconn.prototype.connect = function(callback) {
  debug('connection connect ' + this.id);
  var self = this;
  callback = callback || function() {};

  // create original connection
  this.conn = mysql.createConnection({
    host: this.conf.host,
    port: this.conf.port,
    user: this.conf.user,
    password: this.conf.pass,
  });

  // connect and select database
  this.conn.connect(function(err) {
    if (!err) {
      //self.query('USE `' + self.conf.db + '`', callback);
      self.query('USE ' + mescapeId(self.conf.db), callback);
    }
    else {
      callback(err);
    }
  });
};

// run sql
AAconn.prototype.query = function(sql, callback) {
  callback = callback || function() {};
  this.conn.query(sql, function(err, data) {
    callback(err, data);
  });
}

// select a table and return a query obj to chain
AAconn.prototype.table = function(name) {
  var query = new AAQuery();
  query.conn = this;
  query.sql.table = mescapeId(this.conf.prefix + name);
  return query;
}

// close connection
// TODO
AAconn.prototype.close = function() {
  debug('connection close ' + this.id);
  this.conn.end();
};


// 开始事务
AAconn.prototype.begin = function(callback) {
  this.query('BEGIN', callback);
}

// 提交事务
AAconn.prototype.commit = function(callback) {
  this.query('COMMIT', callback);
}

// 回滚事务
AAconn.prototype.rollback = function(callback) {
  this.query('ROLLBACK', callback);
}

// 事务流程
AAconn.prototype.transaction = function(query, callback) {
  var self = this;
  callback = callback || function() {};

  var tot = 0;
  var flag = false;
  var cbed = false;
  var cb = function(err) {
    tot++;
    flag = err ? true : flag;
    if (!cbed && (flag || tot == query.length)) {
      cbed = true;
      if (flag) {
        self.rollback();
        callback('transaction error');
      } else {
        self.commit();
        callback(null);
      }
    }
  }

  this.begin();
  for (var i = 0; i < query.length; i++)
    this.query(query[i], cb);
}
