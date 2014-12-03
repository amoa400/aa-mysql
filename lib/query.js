var mysql = require('mysql');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;
var debug = require('debug')('query');

// query class
var AAQuery = module.exports = function() {
  this.sql = {};
  this.option = {};
  this.conn = {};
}

/**
 * set filed
 * 
 * accept multiple arguments
 * for every i-th argument, parsing rules are as follows:
 *   string -> escaped(arg[i])
 *   array[field, notEscapeField, asField, notEscapeAsFiled] -> arg[i][0] AS arg[i][3]
 *
 * example:
 *   field('id', 'name') -> SELECT `id`, `name` ....
 *   field('id', ['name', true], ['gender', true, 'sex']) -> SELECT `id`, name, gender AS `sex` ...
 */
AAQuery.prototype.field = function() {
  arg = arguments;

  this.sql.field = '';
  for (var i = 0; i < arg.length; i++) {
    if (i !== 0) {
      this.sql.field += ', ';
    }
    if (typeof arg[i] === 'object') {
      this.sql.field += arg[i][1] ? arg[i][0] : mescapeId(arg[i]);
      if (arg[i].length > 2) {
        this.sql.field += ' AS ' + (arg[i][3] ? arg[i][2] : mescapeId(arg[i][2]));
      }
    }
    else {
      this.sql.field += mescapeId(arg[i]);
    }
  }

  return this;
}

/*
 * 条件设置
 *
 * 逻辑，被数组包裹，可包含条件组或逻辑，若最后一个参数为字符串，则条件组之间使用该逻辑，默认AND
 * 条件组，被对象包裹，表示该条件组的所有条件
 * 条件，若为字符串，则关系为等于直接赋值，若为数组，则第一个参数为值，第二个参数为关系
 *                                                     第三个参数为关键字是否不过滤
 *                                                     第四个参数为值是否不过滤
 * 例子：[[{a: 1}, [{b: 2}, {c: [3, '<']}, 'OR']], {d: 4, 'COUNT(*)': [5, '>', true]}, 'OR']
 * 解析：(`a` = 1 AND (`b` = 2 OR `c` < 3)) OR (`d` = 4 AND COUNT(*) > 5)
 *
 */
AAQuery.prototype.where = function() {
  var arg = arguments;
  var join = false;

  if (arg[arg.length - 1] == 'JOIN') {
    join = true;
    arg[arg.length - 1] = 'AND';
  }

  // 直接使用字符串作为where条件
  if (arg.length == 1 && typeof arg[0] == 'string') {
    if (join)
      return arg[0];
    else
      this.sql.where = arg[0];
    return this;
  }

  // 解析条件
  function parse(arr) {
    var tot = arr.length;
    var logic = (typeof arr[tot - 1] == 'string') ? arr[tot - 1] : 'AND';
    var sql = '';

    for (var i = 0; i < tot; i++) {
      if (typeof arr[i] == 'string') continue;
      sql += (i == 0) ? '' : ' ' + logic + ' ';

      if (arr[i].length === undefined) {
        var tSql = '';
        var sum = 0;
        for (var j in arr[i]) {
          tSql += (sum > 0) ? ' AND ' : '';
          sum++;
          if (typeof arr[i][j] == 'object') {
            tSql += arr[i][j][2] ? j : mescapeId(j);
            tSql += ' ' + arr[i][j][1] + ' ';
            tSql += arr[i][j][3] ? arr[i][j][0] : mescape(arr[i][j][0]);
          }
          else
            tSql += mescapeId(j) + ' = ' + mescape(arr[i][j]);
        }

        sql += (sum > 1) ? '(' + tSql + ')' : tSql;
      }
      else 
        sql += '(' + parse(arr[i]) + ')';
    }

    return sql;
  }

  if (join)
    return parse(arg);
  else
    this.sql.where = parse(arg);

  return this;
}

/* 
 * 排序设置
 *
 * 可传入多个参数
 * 若i-th参数为字符串，则默认按升序排列
 * 若i-th参数为数组，则按arg[i][1]排列
 */
AAQuery.prototype.order = function() {
  var arg = arguments;

  this.sql.order = '';
  for (var i = 0; i < arg.length; i++) {
    if (i != 0)
      this.sql.order += ', ';
    if (typeof arg[i] == 'object')
      this.sql.order += mescapeId(arg[i][0]) + ' ' + arg[i][1];
    else
      this.sql.order += mescapeId(arg[i]) + ' ASC';
  }

  return this;
}

/* 
 * 条目限制
 *
 * @param {Number} 偏移量
 * @param {Number} 总数量
 */ 
AAQuery.prototype.limit = function(offset, rows) {
  if (typeof rows != 'number') {
    rows = offset;
    offset = null;
  }

  this.sql.limit = '';
  this.sql.limit += (typeof offset == 'number') ? offset + ', ' : '';
  this.sql.limit += (typeof rows == 'number') ? rows : '';

  return this;
}

/* 
 * 翻页限制
 *
 * @param {Number} 页数
 * @param {Number} 每页数量
 */ 
AAQuery.prototype.page = function(num, rows) {
  num = num || 1;
  rows = rows || 10;

  this.sql.limit = ((num - 1) * rows) + ', ' + rows;

  return this;
}

// 其他选项
AAQuery.prototype.op = function(option) {
  this.option = option;
  return this;
}

// 筛选数据
AAQuery.prototype.select = function(callback) {
  if (this.option.find) {
    this.sql.limit = '1';
  }

  this.sql.final = 'SELECT ';
  this.sql.final += this.sql.field ? this.sql.field : '*';
  this.sql.final += ' FROM ';
  this.sql.final += this.sql.table;
  this.sql.final += this.sql.where ? ' WHERE ' + this.sql.where : '';
  this.sql.final += this.sql.order ? ' ORDER BY ' + this.sql.order : '';
  this.sql.final += this.sql.limit ? ' LIMIT ' + this.sql.limit : '';
  this.sql.final += ';';

  return this.exec(callback);
}

// 筛选一条数据
AAQuery.prototype.find = function(callback) {
  this.option.find = 1;
  return this.select(callback);
}

// 删除
AAQuery.prototype.delete = function(callback) {
  this.sql.final = 'DELETE FROM ';
  this.sql.final += this.sql.table;
  this.sql.final += ' WHERE '
  this.sql.final += this.sql.where;
  this.sql.final += ';';

  return this.exec(callback);
}

// 插入
AAQuery.prototype.insert = function(data, callback) {
  data = (data.length === undefined) ? [data] : data;
  callback = callback || function() {};

  this.sql.final = 'INSERT INTO ';
  this.sql.final += this.sql.table;

  this.sql.final += ' (';
  var  flag = false;
  for (var i in data[0]) {
    if (flag)
      this.sql.final += ', ';
    else
      flag = true;
    this.sql.final += mescapeId(i);
  }
  this.sql.final += ') ';

  this.sql.final += 'VALUES ';
  for (var i = 0; i < data.length; i++) {
    if (i != 0)
      this.sql.final += ', ';
    var flag = false;
    this.sql.final += '(';
    for (var j in data[0]) {
      if (flag)
        this.sql.final += ', ';
      else
        flag = true;
      this.sql.final += mescape(data[i][j]);
    }
    this.sql.final += ')';
  }
  this.sql.final += ';';

  return this.exec(callback);
}

// 更改
AAQuery.prototype.update = function(data, callback) {
  data = data || {};
  callback = callback || function() {};

  this.sql.final = 'UPDATE ';
  this.sql.final += this.sql.table;
  this.sql.final += ' SET '

  var flag = false;
  for (var i in data) {
    if (flag)
      this.sql.final += ', ';
    else
      flag = true;
    if (typeof data[i] == 'object')
      this.sql.final += mescapeId(i) + ' = ' + data[i][0];
    else
      this.sql.final += mescapeId(i) + ' = ' + mescape(data[i]);
  }
  if (!flag) {
    callback(null);
    return '';
  }

  this.sql.final += ' WHERE '
  this.sql.final += this.sql.where;
  this.sql.final += ';';

  return this.exec(callback);
}

// 执行查询
AAQuery.prototype.exec = function(callback) {
  callback = callback || function() {};

  if (this.option.explain)
    this.sql.final = 'EXPLAIN ' + this.sql;
  if (this.option.show) {
    console.log(this.sql.final);
    return;
  }
  if (this.option.get) {
    return this.sql.final;
  }

  if (this.pool) {
    this.conn = this.pool;
  }

  var self = this;
  this.conn.query(this.sql.final, function(err, data) {
    if (err) {
      callback(err);
    }
    else
    if (self.option.find && data) {
      callback(err, data[0]);
    }
    else {
      callback(err, data);
    }
  });
}

// 连结查询
AAQuery.prototype.join = function(name, on) {
  this.sql.table += ' JOIN ' + mescapeId(this.conn._config.prefix + name);
  if (on)
    this.sql.table += ' ON ' + this.where(on, 'JOIN');
  return this;
}
