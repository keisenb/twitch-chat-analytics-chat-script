require('dotenv').load();
const cassandra = require('cassandra-driver');
var fs = require('fs');

var ssl_option = {
  cert : fs.readFileSync("./server.crt"),
  secureProtocol: 'TLSv1_2_method'
};

const authProviderLocalCassandra = new cassandra.auth.PlainTextAuthProvider(process.env.CASSANDRA_USERNAME, process.env.CASSANDRA_PASSWORD);
const cassandraClient = new cassandra.Client({contactPoints: [process.env.CASSANDRA_CONTACT_POINT], authProvider: authProviderLocalCassandra, sslOptions:ssl_option});

const query = 'SELECT * FROM prod.messages';

cassandraClient.execute(query)
  .then(e => console.log(e.rows.length));


