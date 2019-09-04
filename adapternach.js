'use strict'

const connectDb = require('./db')

module.exports = {
  categories: async () => {
    let db
    let categories = []

    try {
      db = await connectDb()
      categories = await db.collection('categories').find().toArray()
    } catch (error) {
      console.error(error)
    }
    return categories
  }
}
