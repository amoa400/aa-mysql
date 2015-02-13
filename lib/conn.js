var util = require('util');
var events = require('events');
var mysql = require('mysql');
var AAQuery = require('./query');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;

// connection class
var AAConn = module.exports = function(conf) {
  // default config
  this.conf = {};
  for (var i in conf) {
    this.conf[i] = conf[i];
  }
  // origin connection
  this.conn = {};
  // id
  this.id = parseInt(Math.random() * 10e6);
}
util.inherits(AAConn, events.EventEmitter);

/** 
 * connect to the mysql server
 */
AAConn.prototype.connect = function(callback) {
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
      //self.query('USE ' + mescapeId(self.conf.db), callback);
      self.query('USE `' + self.conf.db + '`', callback);
    }
    else {
      callback(err);
    }
  });

  // bind events
  this.conn.on('error', function(err) {
    self.emit('error', err);
  });
  this.conn.on('end', function(err) {
    self.emit('end', err);
  });
};

/**
 * select a table and return a query obj to chain
 *
 * @param {String} table name
 */ 
AAConn.prototype.table = function(name) {
  var query = new AAQuery();
  query.conn = this;
  query.sql.table = mescapeId(this.conf.prefix + name);
  return query;
}

/**
 * auto transaction procedure
 *
 * @param {Array} query string list
 */
AAConn.prototype.transaction = function(querys, callback) {
  var self = this;
  callback = callback || function() {};

  var tot = 0;
  var retErr = null;
  var retRes = [];
  var cb = function(err, res, id) {
    tot++;
    retErr = retErr || err;
    retRes[id] = res;

    if (tot === querys.length) {
      if (retErr) {
        self.rollback();
        callback(retErr, retRes);
      } else {
        self.commit();
        callback(null, retRes);
      }
    }
  }

  this.begin();
  for (var i = 0; i < querys.length; i++) {
    (function(i){
      self.query(querys[i], function(err, res) {
        cb(err, res, i);
      });
    })(i);
  }
}

/**
 * close the connection
 */
AAConn.prototype.close = function() {
  if (this.closed) return;
  this.closed = true;
  this.conn.destroy();
};

/**
 * query a sql
 *
 * @param {String} sql string
 */
AAConn.prototype.query = function(sql, callback) {
  var self = this;
  callback = callback || function() {};
  this.conn.query(sql, function(err, res) {
    if (err && err.fatal) {
      self.close();
    }
    callback(err, res);
  });
}

/**
 * begin transaction
 */
AAConn.prototype.begin = function(callback) {
  this.query('BEGIN', callback);
}

/**
 * commit transaction
 */
AAConn.prototype.commit = function(callback) {
  this.query('COMMIT', callback);
}

/**
 * rollback transaction
 */
AAConn.prototype.rollback = function(callback) {
  this.query('ROLLBACK', callback);
}
