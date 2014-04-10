var mysql = require('mysql');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;
var debug = require('debug')('conn');
var AAquery = require('./query');

// 数据库连接
function AAconn(config) {
  // 配置
  this._config = config;
  // 连接
  this._conn = {};
  // 编号
  this.id = '';
  // 类别
  this.class = '';
  // 活动时间
  this.time = 0;
  // 连接池
  this.pool = {};
}

// 连接数据库
AAconn.prototype.connect = function(callback) {
  debug('connection connect ' + this.id);
  var self = this;
  callback = callback || function() {};

  this._conn = mysql.createConnection({
    host: this._config.host,
    port: this._config.port,
    user: this._config.user,
    password: this._config.pass,
  });

  this._conn.connect(function(err) {
    if (!err)
      self._conn.query('USE ' + mescapeId(self._config.db), callback);
    else
      callback(err);
  });
};

// 关闭连接
AAconn.prototype.close = function() {
  debug('connection close ' + this.id);
  this._conn.end();
};

// 选择数据表并开启新查询
AAconn.prototype.table = function(name) {
  var query = new AAquery();
  query.conn = this;
  query.sql.table = mescapeId(this._config.prefix + name);
  return query;
}

// 执行查询
AAconn.prototype.query = function(sql, callback) {
  callback = callback || function() {};
  if (!sql) {
    callback(null);
    return;
  }
  this._conn.query(sql, function(err, data) {
    callback(err, data);
  });
}

// 释放连接
AAconn.prototype.release = function() {
  this.pool.release(this);
}

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

module.exports = AAconn;

