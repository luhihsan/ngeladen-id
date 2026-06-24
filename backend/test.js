const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.ngeladen-cluster.i5aoa4e.mongodb.net",
  (err, addresses) => {
    console.log(err);
    console.log(addresses);
  }
);