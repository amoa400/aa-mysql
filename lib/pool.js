var mysql = require('mysql');
var debug = require('debug')('pool');
var AAconn = require('./conn');

// 数据库连接池
function AApool() {
  // 默认配置
  this._config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    pass: '',
    prefix: '',
    db: '',
    connLimit: 20,
    deadTime: 30
  }
  // 连接综述
  this.totConn = 0;
  // 空闲连接
  this.freeConn = [];
  // 活跃连接
  this.activeConn = [];
  // 等待队列
  this.waiter = [];
}

// 默认配置
AApool.prototype.config = function(obj) {
  debug('config');
  obj = obj || {};
  
  for (var i in obj) {
    var isin = false;
    for (var j in this._config) {
      if (i == j) {
        isin = true;
        break;
      }
    }
    if (isin) {
      this._config[i] = obj[i];
    }
  }
}

// 获取一个连接
AApool.prototype.get = function(callback) {
  debug('get connection');
  callback = callback || function() {};

  // 若无法获得新连接则清理死亡连接
  if (this.freeConn.length == 0 && this._config.connLimit !== 0 && this.totConn >= this._config.connLimit)
    this.cleanDead();

  // 存在空闲连接
  if (this.freeConn.length > 0) {
    debug('get connection free');
    var conn = this.freeConn.shift();
    conn.class = 'active';
    conn.time = parseInt(new Date().getTime() / 1000);
    this.activeConn.push(conn);
    callback(null, conn);
    return;
  }

  // 新建连接
  if (this._config.connLimit === 0 || this.totConn < this._config.connLimit) {
    debug('get connection new');
    this.create(callback);
    return;
  }

  // 加入等待队列
  debug('get connection wait');
  this.waiter.push(callback);
}

// 释放一个连接
AApool.prototype.release = function(conn) {
  debug('release connection');
  conn = conn || {};

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
AApool.prototype.create = function(callback) {
  debug('create connection');
  callback = callback || function() {};
  var self = this;
  var conn = new AAconn(this._config);
  conn.id = this.getID();
  conn.class = 'active';
  conn.time = parseInt(new Date().getTime() / 1000);
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
AApool.prototype.delete = function(conn) {
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
AApool.prototype.waiterGet = function() {
  if (this.waiter.length > 0) {
    debug('waiter get');
    this.get(this.waiter.shift());
  }
}

// 清理死亡连接
AApool.prototype.cleanDead = function() {
  var cntTime = parseInt(new Date().getTime() / 1000);
  for (var i = 0; i < this.activeConn.length; i++) {
    if (cntTime - this.activeConn[i].time <= this._config.deadTime) continue;
    this.delete(this.activeConn[i]);
    break;
  }
}

// 生成一个随机ID
AApool.prototype.getID = function() {
  var set = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.#@!';
  var s = '';
  for (var i = 0; i < 10; i++) {
    s += set[parseInt(Math.random() * set.length)];
  }
  return s;
}

// 检测系统状态
AApool.prototype.monitor = function() {
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

module.exports = AApool;