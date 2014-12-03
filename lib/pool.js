var debug = require('debug')('pool');
var mysql = require('mysql');
var AAConn = require('./conn');
var AAQuery = require('./query');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;

// connection pool class
var AAPool = module.exports = function(conf) {
  // default config
  this.conf = conf;
  // total connections
  this.totConn = 0;
  // free connections
  this.freeConn = [];
  // active connections
  this.activeConn = [];
  // waiting list (not that waiter)
  this.waiter = [];
}

/**
 * get an available connection
 */
AAPool.prototype.get = function(callback) {
  debug('get connection');
  callback = callback || function() {};

  // exist free connection
  if (this.freeConn.length > 0) {
    debug('get connection free');
    var conn = this.freeConn.shift();
    conn.class = 'active';
    this.activeConn.push(conn);
    callback(null, conn);
    return;
  }

  // create new connection
  if (this.conf.connLimit === 0 || this.totConn < this.conf.connLimit) {
    debug('get connection new');
    this.create(callback);
    return;
  }

  // add to waiting list
  debug('get connection wait');
  this.waiter.push(callback);
}

/**
 * release a connection to pool
 *
 * @param {Object} connection
 */
AAPool.prototype.release = function(conn) {
  debug('release connection');
  conn = conn || {};
  if (conn.class !== 'active') return;

  var index = this.activeConn.indexOf(conn);
  if (index === -1) return;

  conn.class = 'free';
  this.activeConn.splice(index, 1);
  this.freeConn.push(conn);

  this.waiterGet();
}

/**
 * select a table and return a query obj to chain
 *
 * @param {String} table name
 */ 
AAPool.prototype.table = function(name) {
  var query = new AAQuery();
  query.pool = this;
  query.sql.table = mescapeId(this.conf.prefix + name);
  return query;
}

/**
 * get a connection and query (Not Recommended)
 * Just for compatible with the old version
 *
 * @param {Object} query data
 */ 
AAPool.prototype.run = function(data, callback) {
  var self = this;
  callback = callback || function() {};

  this.get(function(err, conn) {
    if (err) {
      callback(err, null);
      return;
    }

    var cb = function(err, res) {
      self.release(conn);
      callback(err, res);
    }

    var query = conn.table(data.table);
    for (var i in data) {
      var value = data[i];

      if (i == 'join') {
        for (var j = 0; j < value.length; j++)
          query = query[i].apply(query, value[j]);
      }
      else
      if (i == 'method') {
        if (value == 'select' || value == 'find' || value == 'delete')
          query = query[value].apply(query, [cb]);
        else
          query = query[value].apply(query, [data.data, cb]);
        return query;
      }
      else
      if (typeof query[i] == 'function')
        query = query[i].apply(query, value);
    }
  });
}

/**
 * query a sql
 *
 * @param {String} sql string
 */
AAPool.prototype.query = function(sql, callback) {
  callback = callback || function() {};
  this.get(function(err, conn) {
    if (err) {
      callback(err)
    }
    else {
      conn.query(sql, callback);
    }
  });
}

/**
 * create a connection
 */
AAPool.prototype.create = function(callback) {
  debug('create connection');
  callback = callback || function() {};

  var conn = new AAConn(this.conf);
  conn.class = 'active';
  this.activeConn.push(conn);
  this.totConn++;

  var self = this;
  conn.connect(function(err) {
    debug('create connection ' + err);
    if (!err) {
      callback(null, conn);
    }
    else {
      self.delete(conn);
      callback('cannot create new connection');
    }
  });

  // bind events
  conn.on('end', function(err) {
    self.delete(conn);
  });
}

/**
 * delete a connection
 *
 * @param {Object} connection
 */
AAPool.prototype.delete = function(conn) {
  debug('delete connection');
  conn = conn || {};
  this.totConn--;

  // free conn
  if (conn.class == 'free') {
    var index = this.freeConn.indexOf(conn);
    if (index !== -1) {
      conn.class = 'delete';
      conn.close();
      this.freeConn.splice(index, 1);
    }
  }
  // active conn
  else {
    var index = this.activeConn.indexOf(conn);
    if (index !== -1) {
      conn.class = 'delete';
      conn.close();
      this.activeConn.splice(index, 1);
    }
  }

  this.waiterGet();
}

/**
 * get a connection for waiter
 */
AAPool.prototype.waiterGet = function() {
  if (this.waiter.length > 0) {
    debug('waiter get');
    this.get(this.waiter.shift());
  }
}
