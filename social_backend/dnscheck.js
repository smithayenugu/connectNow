const dns = require('dns').promises;

console.log('Starting SRV resolution test...');

dns.resolveSrv('_mongodb._tcp.connect.neleg.mongodb.net')
  .then(records => {
    console.log('SRV records:', records);
    return dns.resolve4(records[0].name);
  })
  .then(addrs => {
    console.log('Resolved IPs:', addrs);
    process.exit(0);
  })
  .catch(err => {
    console.error('DNS error:', err);
    process.exit(1);
  });
