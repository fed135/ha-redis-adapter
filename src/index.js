/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('redis');
const crypto = require('crypto');
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
    get: promisify(connection.send_command).bind(connection, 'HGET'),
    set: promisify(connection.send_command).bind(connection, 'HSET'),
    size: promisify(connection.send_command).bind(connection, 'HLEN'),
    clear: promisify(connection.send_command).bind(connection, 'HDEL'),
    clearAll: promisify(connection.send_command).bind(connection, 'DEL'),
  };

  return (config, emitter) => {
    const curve = tween(config.cache);
    const localKey = crypto.randomBytes(10).toString('hex');
    const hashKeyTTL = Math.ceil((curve(config.cache.steps - 1) - curve(config.cache.steps - 2)) * 1.2);

    // Disconnection issues
    connection.on('error', storePluginErrorHandler);

    function storePluginErrorHandler(err) {
      try {
        clear('*')
      }
      catch(e) {}
      if (connection && connection.close) connection.close();
      emitter.emit('storePluginErrored', err);
    }

    /**
     * Performs a query that returns a single entities to be cached
     * @param {object} opts The options for the dao
     * @param {string} method The dao method to call
     * @returns {Promise}
     */
    async function get(key) {
      return await store.get([localKey, key])
        .catch(storePluginErrorHandler)
        .then((res) => {
          const record = JSON.parse(res);
          if (record !== null) {
            const now = Date.now();
            const ext = curve(record.step);
            const ttl = Math.min(record.timestamp + ext, record.timestamp + config.cache.limit);
            // If expired
            if (now > ttl || record.step + 1 >= config.cache.steps) {
              clear(key);
              return null;
            }
            else {
              record.step = record.step + 1;
              emitter.emit('cacheBump', { localKey: `${localKey}::${key}`, key, timestamp: record.timestamp, step: record.step, expires: ttl });
              store.set([localKey, key, JSON.stringify(record)]);
            }
          }
          return record;
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

      keys.forEach((id) => {
        let value = { value: values[id] };
        if (opts && opts.step !== undefined) {
          value.timestamp = now;
          value.step = opts.step;
          b.hset(localKey, recordKey(id), JSON.stringify(value));
        }
      });
      b.pexpire(localKey, hashKeyTTL);
      return await b.exec()
    }

    /**
     * Clears a specified computed key from the store
     * @param {string} key The key to search for
     * @returns {boolean} Wether the key was removed or not 
     */
    function clear(key) {
      if (key === '*') {
        return !!store.clearAll([localKey])
          .catch(storePluginErrorHandler);
      }
      return !!store.clear([localKey, key])
        .catch(storePluginErrorHandler);
    }

    async function size() {
      const hashLength = await store.size([localKey])
        .catch(storePluginErrorHandler);
      return hashLength || 0;
    }

    return { get, set, clear, size, connection };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
