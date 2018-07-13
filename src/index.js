/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('redis');
const { promisify } = require('util');

/* Methods -------------------------------------------------------------------*/

/**
 * Store constructor
 * @param {object} config The options for the store
 * @param {EventEmitter} emitter The event-emitter instance for the batcher
 * @param {Map} store A store instance to replace the default in-memory Map
 */
function redisStore(host, settings) {
  const connection = redis.createClient(host, settings);
  const store = {
    get: promisify(connection.get).bind(connection),
    set: promisify(connection.set).bind(connection),
  };

  return (config, emitter) => {

    /**
     * Performs a query that returns a single entities to be cached
     * @param {object} opts The options for the dao
     * @param {string} method The dao method to call
     * @returns {Promise}
     */
    async function get(key) {
      return await store.get(key)
        .catch(console.error)
        .then(JSON.parse);
    }

    /**
     * Performs a query that returns a single entities to be cached
     * @param {object} opts The options for the dao
     * @param {string} method The dao method to call
     * @returns {Promise}
     */
    async function set(recordKey, keys, values, opts) {
      const b = connection.batch();
      const now = Date.now();

      keys.forEach((id) => {
        let value = { value: values[id] };
        if (opts && opts.ttl) {
          value.timestamp = now;
          b.set(recordKey(id), JSON.stringify(value), 'EX', Math.ceil(opts.ttl / 1000));
        }
        else b.set(recordKey(id), JSON.stringify(value));
      });
      return await b.exec()
    }

    /**
     * Checks if a computed key is present in the store
     * @param {string} key The key to search for
     * @returns {boolean} Wether the key is in the store or not 
     */
    async function has(key) {
      return !!(await store.get(key)).catch(console.error);
    }

    /**
     * Clears a specified computed key from the store
     * @param {string} key The key to search for
     * @returns {boolean} Wether the key was removed or not 
     */
    function clear(key) {
      return !!connection.set(key, null, 'EX', 1);
    }

    function size() {
      return 0; // TODO: server_info doesn't alway return db0
      return connection.server_info.db0.keys; // TODO: select proper db
    }

    return { get, set, has, clear, size };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
