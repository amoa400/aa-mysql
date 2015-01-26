var mysql = require('mysql');
var mescape = mysql.escape;
var mescapeId = mysql.escapeId;

// query class
var AAQuery = module.exports = function() {
  this.sql = {};
  this.op = {};
  this.conn = {};
}

/**
 * set filed
 * 
 * @param {String} field name
 * @param {Boolean} not escape field (default: false)
 * @param {String} as field name (default: '')
 * @param {Boolean} not escape as field (default: false)
 *
 * if there are multiple field, you can use the following method:
 *   (field, [field, notEscapeField, asField, notEscapeAsFiled], ...)
 *
 * example:
 *   field('a') -> SELECT `a` ...
 *   field(['COUNT(`a`)', true, 'count']) -> SELECT COUNT(`a`) AS `count` ...
 *   field('a', ['COUNT(`b`)', true, 'count', true]) -> SELECT `a`, COUNT(`b`) AS count ...
 */
AAQuery.prototype.field = function() {
  arg = arguments;

  this.sql.field = '';
  for (var i = 0; i < arg.length; i++) {
    if (i !== 0) {
      this.sql.field += ', ';
    }
    if (typeof arg[i] === 'object') {
      this.sql.field += arg[i][1] ? arg[i][0] : mescapeId(arg[i][0]);
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

/**
 * set where
 * 
 * logic group (Array):
 *   @param {Object} logic group or condition group
 *   @param {Object} logic group or condition group
 *   ...
 *   @param {String} logci type (default: AND)
 *
 * condition group (Object):
 *   @param {Key-Value} condition
 *   @param {Key-Value} condition
 *   ...
 *   @param {Key-Value} condition
 *
 * condition {Key-Value}:
 *   @key {String} field name
 *   @value {String} field value
 *   @value {String} judging relation
 *   @value {Boolean} not escape key field 
 *   @value {Boolean} not escape value field
 *
 * the arguments of this function is like: (logic group, condition group, logic group, ...., logic type)
 * the arguments list is logic group
 *
 * especially, if the arguments.length = 1, and the type of first argument is String,
 * then the first argument will be the final where condition
 *
 * maybe you can see the usage of this function is very complicated, but when you really use it,
 * you can see it's simple and powerful, hope you can like it... (^-^)
 *
 * example:
 *   where({a: 1}) -> WHERE `a` = 1 ...
 *   where({a: [1, '>']}) -> WHERE `a` > 1 ...
 *   where({a: ['DAYOFWEEK(1)', '=', false, true]}) -> WHERE `a` = DAYOFWEEK(1) ...
 *   where({a: 1, b: 1}) -> WHERE `a` = 1 AND `b` = 1 ...
 *   where({a: 1, b: 1}, {c: 1}) -> WHERE (`a` = 1 AND `b` = 1) AND (`c` = 1) ...
 *   where({a: 1, b: 1}, {c: 1}, 'OR') -> WHERE (`a` = 1 AND `b` = 1) OR (`c` = 1) ...
 *   where([{a: 1}, [{b: 2}, {c: [3, '<']}, 'OR']], {d: 4, e: ['DAYOFWEEK(5)', '=', false, true]}, 'OR') ->
 *     WHERE (`a` = 1 AND (`b` = 2 OR `c` < 3)) OR (`d` = 4 AND `e` = DAYOFWEEK(5)) ...
 *   where('a = 1') -> WHERE a = 1 ...
 */
AAQuery.prototype.where = function() {
  var arg = arguments;
  var join = false;

  if (arg[arg.length - 1] == 'JOIN') {
    join = true;
    arg[arg.length - 1] = 'AND';
  }

  if (arg.length == 1 && typeof arg[0] == 'string') {
    if (join) {
      return arg[0];
    }
    else {
      this.sql.where = arg[0];
    }
    return this;
  }

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
          else {
            tSql += mescapeId(j) + ' = ' + mescape(arr[i][j]);
          }
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

/**
 * set order
 * 
 * @param {String} field name
 * @param {String} order type (default: ASC)
 * @param {Boolean} not escape field (default: false)
 *
 * if there are multiple order condition, you can use the following method:
 *   ([field name, order type, notEscapeField], [field name, order type, notEscapeField], ...)
 *
 * @example:
 *   order('a') -> ORDER BY `a` ASC ...
 *   order('COUNT(`a`)', 'DESC', true) -> ORDER BY COUNT(`a`) DESC ...
 *   order(['a'], ['COUNT(`b`)', 'DESC', true]) -> ORDER BY `a` ASC, COUNT(`b`) DESC ...
 */
AAQuery.prototype.order = function() {
  if (typeof arguments[0] === 'string') {
    var arg = [];
    arg.push(arguments);
  }
  else {
    arg = arguments;
  }

  this.sql.order = '';
  for (var i = 0; i < arg.length; i++) {
    if (i != 0) {
      this.sql.order += ', ';
    }
    this.sql.order += arg[i][2] ? arg[i][0] : mescapeId(arg[i][0]);
    this.sql.order += ' ' + (arg[i][1] || 'ASC');
  }

  return this;
}

/* 
 * set limit
 *
 * @param {Number} offset (default: 0)
 * @param {Number} rows
 */ 
AAQuery.prototype.limit = function(offset, rows) {
  if (typeof rows != 'number') {
    rows = offset;
    offset = 0;
  }

  this.sql.limit = '';
  this.sql.limit += offset ? offset + ', ' : '';
  this.sql.limit += rows;

  return this;
}

/* 
 * set page limit
 *
 * @param {Number} pagination (default: 1)
 * @param {Number} rows per page (default: 10)
 */ 
AAQuery.prototype.page = function(num, rows) {
  num = num || 1;
  rows = rows || 10;

  this.sql.limit = ((num - 1) * rows) + ', ' + rows;

  return this;
}

/**
 * set join
 *
 *
 * @param {String} join table name
 * @param {Object} join condition (default: null) (usage: see where)
 *
 * if there are multiple join data, you can use the following method:
 *   (name, [name, on], [name, on], ...)
 *
 * @example:
 *   join('a') -> JOIN `a` ...
 *   join('a', {b: 1}) -> JOIN `a` ON `b` = 1 ...
 *   join(['c'], ['a', {b: 1}]) -> JOIN `c` JOIN `a` ON `b` = 1 ...
 */
AAQuery.prototype.join = function() {
  if (typeof arguments[0] === 'string') {
    var arg = [];
    arg.push(arguments);
  } else {
    arg = arguments;
  }

  if (this.pool) {
    this.conn = this.pool;
  }

  for (var i = 0; i < arg.length; i++) {
    this.sql.table += ' LEFT JOIN ' + mescapeId(this.conn.conf.prefix + arg[i][0]);
    this.sql.table += arg[i][1] ? ' ON ' + this.where(arg[i][1], 'JOIN') : '';
  }

  return this;
}

/**
 * set query option
 *
 * @param {Object} option
 *   explain {Boolean} explain the query process (default: false) 
 *   show {Boolean} show the sql (console.log) (default: false) 
 *   get {Boolean} get the sql (will return) (default: false) 
 */
AAQuery.prototype.option = function(op) {
  this.op = op;
  return this;
}

/**
 * select
 */
AAQuery.prototype.select = function(callback) {
  if (this.op.find) {
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

/**
 * find (select limit 1)
 */
AAQuery.prototype.find = function(callback) {
  this.op.find = 1;
  return this.select(callback);
}

/**
 * delete
 */
AAQuery.prototype.delete = function(callback) {
  this.sql.final = 'DELETE FROM ';
  this.sql.final += this.sql.table;
  this.sql.final += ' WHERE '
  this.sql.final += this.sql.where;
  this.sql.final += ';';

  return this.exec(callback);
}

/**
 * insert
 *
 * @param {Object} data
 *
 * if there are multiple data, you can use the following method:
 *   ([data, data, data, ...])
 *
 * @example:
 *   insert({a: 1, b: 2}) -> INSERT INTO `table`(`a`, `b`) VALUES(1, 2) ...
 *   insert([{a: 1, b: 2}, {a: 3, b: 4}]) -> INSERT INTO `table` (`a`, `b`) VALUES (1, 2), (3, 4) ...
 */
AAQuery.prototype.insert = function(data, callback) {
  data = (data instanceof Array) ? data : [data];
  callback = callback || function() {};

  this.sql.final = 'INSERT INTO ';
  this.sql.final += this.sql.table;

  this.sql.final += ' (';
  var  flag = false;
  for (var i in data[0]) {
    if (flag) {
      this.sql.final += ', ';
    }
    else {
      flag = true;
    }
    this.sql.final += mescapeId(i);
  }
  this.sql.final += ') ';

  this.sql.final += 'VALUES ';
  for (var i = 0; i < data.length; i++) {
    if (i !== 0) {
      this.sql.final += ', ';
    }
    var flag = false;
    this.sql.final += '(';
    for (var j in data[0]) {
      if (flag) {
        this.sql.final += ', ';
      }
      else {
        flag = true;
      }
      this.sql.final += mescape(data[i][j]);
    }
    this.sql.final += ')';
  }
  this.sql.final += ';';

  return this.exec(callback);
}

/**
 * update
 *
 * @param {Object} data
 *
 * @example:
 *   update({a: 1, b: 2}) -> UPDATE `table` SET `a` = 1, `b` = 2 ...
 */
AAQuery.prototype.update = function(data, callback) {
  data = data || {};
  callback = callback || function() {};

  this.sql.final = 'UPDATE ';
  this.sql.final += this.sql.table;
  this.sql.final += ' SET '

  var flag = false;
  for (var i in data) {
    if (flag) {
      this.sql.final += ', ';
    }
    else {
      flag = true;
    }
    this.sql.final += mescapeId(i) + ' = ' + ((typeof data[i] === 'object' && data[i][1] === true) ? data[i][0] : mescape(data[i]));
  }

  this.sql.final += this.sql.where ? ' WHERE ' + this.sql.where : '';
  this.sql.final += ';';

  return this.exec(callback);
}

/**
 * execute sql
 */
AAQuery.prototype.exec = function(callback) {
  callback = callback || function() {};

  if (this.op.explain) {
    this.sql.final = 'EXPLAIN ' + this.sql.final;
  }
  if (this.op.show) {
    console.log(this.sql.final);
    return this.sql.final;
  }
  if (this.op.get) {
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
    if (self.op.find && data) {
      callback(err, data[0]);
    }
    else {
      callback(err, data);
    }
  });
}
