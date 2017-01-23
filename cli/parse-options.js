module.exports = parseOptions

var log = require('npmlog')
var path = require('path')
var PouchDB = require('pouchdb-core')
var urlParse = require('url').parse

/**
 * Parse options into internal config structure.
 *
 * Options are all the things that users can pass in to Hoodie as described at
 * https://github.com/hoodiehq/hoodie#usage. All these options are flat, while
 * internally we group theem into db, connection and path options.
 *
 * `appOptions` are app-specific default options configured in the
 * app’s package.json (on the `"hoodie"` key).
 *
 * The parsing of the database configuration is a bit more complex. If `dbUrl`
 * is passed it means that a remote CouchDB is used for persistance, otherwise
 * PouchDB is being used. A shortcut to set PouchDB’s adapter to memdown is to
 * passe set the `inMemory: true` option. If it’s not set, leveldown is used
 * with the prefix set to `options.data` + 'data' (`.hoodie/data` by default).
 */

function parseOptions (options) {
  var dbOptions = {}

  var config = {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    inMemory: Boolean(options.inMemory)
  }

  log.level = config.loglevel

  if (options.url) {
    config.url = options.url
  }

  if (options.adminPassword) {
    config.adminPassword = options.adminPassword
  }

  PouchDB.plugin(require('pouchdb-mapreduce'))

  if (options.dbUrl) {
    if (!urlParse(options.dbUrl).auth) {
      throw new Error('Authentication details missing from database URL: ' + options.db.url)
    }

    PouchDB.plugin(require('pouchdb-adapter-http'))
    dbOptions.prefix = options.dbUrl
    log.info('config', 'Storing all data in ' + options.dbUrl)
  } else if (options.inMemory) {
    PouchDB.plugin(require('pouchdb-adapter-memory'))
    config.inMemory = true
    log.info('config', 'Storing all data in memory only')
  } else {
    PouchDB.plugin(require(options.dbAdapter))
    dbOptions.prefix = path.join(config.paths.data, 'data') + path.sep
    log.info('config', 'Storing all data in ' + dbOptions.prefix + ' using ' + options.dbAdapter)
  }
  config.PouchDB = PouchDB.defaults(dbOptions)

  return config
}
