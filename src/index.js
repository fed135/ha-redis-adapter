/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('redis');
const { promisify } = require('util');

/* Methods -------------------------------------------------------------------*/

function redisStore(localKey, host) {
  let connection;
  let store;
  
  function storePluginInit() {
    connection = redis.createClient(host);
    store = {
      get: promisify(connection.get).bind(connection),
      set: promisify(connection.set).bind(connection),
      size: () => 0,
      clear: promisify(connection.del).bind(connection),
      clearAll: () => null,
    };
  };

  storePluginInit();

  return (config) => {
    async function get(key) {
      return await store.get(`${localKey}:${key}`)
        .then((res) => {
          if (res === null) return undefined;
          return JSON.parse(res);
        }, (err) => undefined);
    }

    async function set(recordKey, keys, values) {
      const b = connection.multi();

      keys.forEach((id) => {
        b.set(`${localKey}:${recordKey(id)}`, JSON.stringify(values[id]), 'PX', config.cache.ttl);
      });
      return await b.exec();
    }

    function clear(key) {
      if (key === '*') {
        return !!store.clearAll();
      }
      return !!store.clear(`${localKey}:${key}`);
    }

    async function size() {
      const hashLength = await store.size();
      return hashLength || 0;
    }

    return { get, set, clear, size, connection };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
