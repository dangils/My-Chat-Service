const config = require('./config/dev')

const { MongoClient } = require('mongodb')

const uri = config.mongoURI
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

module.exports = client
