var mysql = require('mysql');
var debug = require('debug')('pool');
var AAConn = require('./conn');

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
    conn.time = parseInt(new Date().getTime() / 1000);
    this.activeConn.push(conn);
    callback(null, conn);
    return;
  }

  // create new connection
  if (this.conf.connLimit === 0 || this.totConn < this._config.connLimit) {
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
  if (conn.class != 'active') return;

  for (var i = 0; i < this.activeConn.length; i++) {
    if (this.activeConn[i] != conn) continue;
    var tConn = this.activeConn[i];
    tConn.class = 'free';
    tConn.time = parseInt(new Date().getTime() / 1000)
    this.activeConn.splice(i, 1);
    this.freeConn.push(tConn);
    break;
  }

  this.waiterGet();
}

// 创建一个连接
AAPool.prototype.create = function(callback) {
  debug('create connection');
  callback = callback || function() {};
  var self = this;
  var conn = new AAConn(this._config);
  conn.id = this.getID();
  conn.class = 'active';
  conn.time = parseInt(new Date().getTime() / 1000);
  conn.pool = this;
  this.activeConn.push(conn);
  this.totConn++;

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
}

// 删除一个连接
AAPool.prototype.delete = function(conn) {
  debug('delete connection');
  conn = conn || {};
  this.totConn--;

  // 空闲连接
  if (conn.class == 'free') {
    for (var i = 0; i < this.freeConn.length; i++) {
      if (this.freeConn[i] != conn) continue;
      this.freeConn[i].class = 'delete';
      this.freeConn[i].close();
      this.freeConn.splice(i, 1);
      break;
    }
  }
  // 活跃连接
  else {
    for (var i = 0; i < this.activeConn.length; i++) {
      if (this.activeConn[i] != conn) continue;
      this.activeConn[i].class = 'delete';
      this.activeConn[i].close();
      this.activeConn.splice(i, 1);
      break;
    }
  }

  this.waiterGet();
}

// 为等待队列中的连接分配新连接
AAPool.prototype.waiterGet = function() {
  if (this.waiter.length > 0) {
    debug('waiter get');
    this.get(this.waiter.shift());
  }
}

// 清理死亡连接
AAPool.prototype.cleanDead = function() {
  var cntTime = parseInt(new Date().getTime() / 1000);
  for (var i = 0; i < this.activeConn.length; i++) {
    if (cntTime - this.activeConn[i].time <= this._config.deadTime) continue;
    this.delete(this.activeConn[i]);
    break;
  }
}

// 生成一个随机ID
AAPool.prototype.getID = function() {
  var set = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.#@!';
  var s = '';
  for (var i = 0; i < 10; i++) {
    s += set[parseInt(Math.random() * set.length)];
  }
  return s;
}

// 获取连接并执行，完成后自动释放
AAPool.prototype.run = function(data, callback) {
  callback = callback || function() {};

  // 获取连接
  this.get(function(err, conn) {
    if (err) {
      callback(err, null);
      return;
    }

    // 回调函数
    var cb = function(err, res) {
      conn.release();
      callback(err, res);
    }

    // 执行查询
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
