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
  // waiting list
  this.waiter = [];
}

// get connction
AAPool.prototype.get = function(callback) {
  debug('get connection');
  callback = callback || function() {};

  // clean dead connection
  if (this.freeConn.length === 0 && this.conf.connLimit !== 0 && this.totConn >= this.conf.connLimit) {
    this.cleanDead();
  }

  // exist free connection
  if (this.freeConn.length > 0) {
    debug('get connection free');
    var conn = this.freeConn.shift();
    conn.class = 'active';
    conn.time = new Date().getTime();
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

// release connection
AAPool.prototype.release = function(conn) {
  debug('release connection');
  conn = conn || {};
  if (conn.class !== 'active') return;

  var index = this.activeConn.indexOf(conn);
  if (index === -1) return;

  conn.class = 'free';
  conn.time = new Date().getTime();
  this.activeConn.splice(index, 1);
  this.freeConn.push(conn);

  this.waiterGet();
}

// select a table and return a query obj to chain
AAPool.prototype.table = function(name) {
  var query = new AAQuery();
  query.pool = this;
  query.sql.table = mescapeId(this.conf.prefix + name);
  return query;
}

// run sql
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

// get conn and query (Not Recommended) (Just for compatible with the old version)
AAPool.prototype.run = function(data, callback) {
  callback = callback || function() {};

  this.get(function(err, conn) {
    if (err) {
      callback(err, null);
      return;
    }

    var cb = function(err, res) {
      conn.release();
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

// create connection
AAPool.prototype.create = function(callback) {
  debug('create connection');
  callback = callback || function() {};

  var conn = new AAConn(this.conf);
  conn.class = 'active';
  conn.time = new Date().getTime();
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

// delete connection
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

// get connection for waiter
AAPool.prototype.waiterGet = function() {
  if (this.waiter.length > 0) {
    debug('waiter get');
    this.get(this.waiter.shift());
  }
}

// clean dead connection
AAPool.prototype.cleanDead = function() {
  var cntTime = new Date().getTime();
  for (var i = 0; i < this.activeConn.length; i++) {
    if (cntTime - this.activeConn[i].time <= this.conf.deadTime * 1000) continue;
    this.delete(this.activeConn[i]);
    break;
  }
}

// 检测系统状态
AAPool.prototype.monitor = function() {
  var self = this;

  var _monitor = function() {
    var cntTime = parseInt(new Date().getTime() / 1000);

    console.log('=========================================================');
    console.log('tot: %d, free: %d, active: %d, wait: %d, time: %d', self.totConn, self.freeConn.length, self.activeConn.length, self.waiter.length, cntTime);
    console.log(' ');
    console.log('free:');
    for (var i = 0; i < self.freeConn.length; i++)
      console.log('  |-- id: %s, class: %s, time: %d(%d)', self.freeConn[i].id, self.freeConn[i].class, self.freeConn[i].time, cntTime - self.freeConn[i].time);
    console.log(' ');
    console.log('active:');
    for (var i = 0; i < self.activeConn.length; i++)
      console.log('  |-- id: %s, class: %s, time: %d(%d)', self.activeConn[i].id, self.activeConn[i].class, self.activeConn[i].time, cntTime - self.activeConn[i].time);
    console.log('=========================================================');
    console.log(' ');
  }
  setInterval(_monitor, 1000);
}
