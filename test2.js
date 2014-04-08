function test() {
  pool.get(function(err, conn) {
    if (err) return;

    var release = function() {
      if (parseInt(Math.random() * 10) !== 0)
      pool.release(conn);
    };

    setTimeout(release, Math.random() * 10000);
  });
  setTimeout(test, Math.random() * 1000);
}
test();