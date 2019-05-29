/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('redis');

/* Methods -------------------------------------------------------------------*/

function redisStore(localKey, host) {
  let store;
  
  function storePluginInit() {
    store = redis.createClient(host);
  };

  storePluginInit();

  return (config) => {
    async function getMulti(recordKey, keys) {
      return new Promise((resolve) => {
        const b = store.multi();

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

    function set(recordKey, keys, values) {
      const b = store.multi();

      keys.forEach((id) => {
        b.set(`${localKey}:${recordKey(id)}`, JSON.stringify(values[id]), 'PX', config.cache.ttl);
      });
      return b.exec();
    }

    function clear(key) {
      return !!store.clear(`${localKey}:${key}`);
    }

    function size() {
      return 0;
    }

    return { getMulti, set, clear, size, store };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
