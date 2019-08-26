const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const Memory = require('lowdb/adapters/Memory')

const json = require('./dbuser.json')
const isLocal = !process.env.NOW_REGION
const type = isLocal ? new FileSync('./dbuser.json') : new Memory

const dbuser = low(type)
dbuser.defaults(json).write()

module.exports = dbuser
