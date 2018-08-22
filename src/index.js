/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('redis');
const { promisify } = require('util');
const { tween } = require('./utils.js');

/* Methods -------------------------------------------------------------------*/

/**
 * Store constructor
 * @param {object} config The options for the store
 * @param {EventEmitter} emitter The event-emitter instance for the batcher
 * @param {Map} store A store instance to replace the default in-memory Map
 */
function redisStore(host) {
  const connection = redis.createClient(host);
  const store = {
    get: promisify(connection.get).bind(connection),
    set: promisify(connection.set).bind(connection),
    size: promisify(connection.send_command).bind(connection, 'DBSIZE'),
  };

  return (config, emitter) => {
    const curve = tween(config.cache);

    // Disconnection issues
    connection.on('error', storePluginErrorHandler);

    function storePluginErrorHandler(err) {
      connection.close();
      emitter.emit('storePluginErrored', err);
    }

    /**
     * Performs a query that returns a single entities to be cached
     * @param {object} opts The options for the dao
     * @param {string} method The dao method to call
     * @returns {Promise}
     */
    async function get(key) {
      return await store.get(key)
        .catch(storePluginErrorHandler)
        .then((res) => {
          const parsed = JSON.parse(res);
          if (parsed !== null) {
            if (Date.now() > parsed.timestamp + curve(parsed.step -1)) {
              parsed.step += 1;
              emitter.emit('cacheBump', { key, timestamp: parsed.timestamp, step: parsed.step, expires: now + curve(parsed.step) });
              store.set(key, JSON.stringify(parsed), 'PX', curve(parsed.step));
            }
          }
          return parsed;
        });
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
      const stepSize = curve(opts.step);

      keys.forEach((id) => {
        let value = { value: values[id] };
        if (opts && opts.step !== undefined) {
          value.timestamp = now;
          value.step = opts.step;
          b.set(recordKey(id), JSON.stringify(value), 'PX', stepSize);
        }
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
      return !!connection.set(key, null, 'EX', 1)
        .catch(storePluginErrorHandler);
    }

    async function size() {
      return await store.size()
        .catch(storePluginErrorHandler);
    }

    return { get, set, has, clear, size, connection };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
