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

    async function getMulti(recordKey, keys) {
      return new Promise((resolve, reject) => {
        const b = connection.multi();

        keys.forEach((id) => {
          if (id !== undefined) {
            b.get(`${localKey}:${recordKey(id)}`);
          }
        });

        b.exec((err, replies) => {
          if (err) resolve(keys.map(id => undefined));
          for (let i = 0; i < replies.length; i++) {
            const index = keys.findIndex(id => id !== undefined);
            if (index > -1) {
              if (replies[i] !== null) keys[index] = JSON.parse(replies[i]);
              else keys[index] = undefined;
            }
          }
          resolve(keys);
        });
      });
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

    return { get, getMulti, set, clear, size, connection };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
