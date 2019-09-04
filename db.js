'use strict'

const { MongoClient } = require('mongodb')
const {
  DB_USER,
  DB_PASSWD,
  DB_HOST,
  DB_NAME
} = process.env

// const mongoUrl = `mongodb://${DB_USER}:${DB_PASSWD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
// const mongoUrl = `mongodb+srv://${DB_USER}:${DB_PASSWD}@platzi-g8u7b.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
const mongoUrl = `mongodb+srv://${DB_USER}:${DB_PASSWD}@${DB_HOST}${DB_NAME}?retryWrites=true&w=majority`

let db

async function connectDB () {
  if (db) return db

  const client = new MongoClient(
    mongoUrl,
    { useNewUrlParser: true },
    { useUnifiedTopology: true }
  )

  try {
    await client.connect()
    db = client.db(DB_NAME)
  } catch (error) {
    console.error('Could not connect to db', mongoUrl, error)
    process.exit(1)
  }

  return db
}

module.exports = connectDB
