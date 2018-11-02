require('dotenv').load();
const cassandra = require('cassandra-driver');
var fs = require('fs');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const dbName = 'test';

var ssl_option = {
  cert: fs.readFileSync("./server.crt"),
  secureProtocol: 'TLSv1_2_method'
};

const authProviderLocalCassandra = new cassandra.auth.PlainTextAuthProvider(process.env.CASSANDRA_USERNAME, process.env.CASSANDRA_PASSWORD);
const client = new cassandra.Client({ contactPoints: [process.env.CASSANDRA_CONTACT_POINT], authProvider: authProviderLocalCassandra, sslOptions: ssl_option });

const mongoClient = new MongoClient(process.env.MONGO, { useNewUrlParser: true });

(async function () {
  await mongoClient.connect();
  console.log("Connected correctly to server");

  const query = "SELECT * FROM prod.messages";

  client.stream(query)
    .on('readable', async function () {
      // readable is emitted as soon a row is received and parsed
      var row;
      while (row = this.read()) {
        try {
          const db = mongoClient.db(dbName);

          var val = { userid: row.userid, username: row.username, message: row.message, posted: row.posted };
          let r = await db.collection('transfer').insertOne(val);
          assert.equal(1, r.insertedCount);

        } catch (err) {
          console.log(err.stack);
        }


      }
    })
    .on('error', function (e) {
      console.log(e);
    })
    .on('end', function () {
      // emitted when all rows have been retrieved and read
      console.log("finished");
      // Close connection
      mongoClient.close();
      client.shutdown();
    });

})();
