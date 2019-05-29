/**
 * Redis store
 */

/* Requires ------------------------------------------------------------------*/

const redis = require('ioredis');

/* Methods -------------------------------------------------------------------*/

function redisStore(localKey, host) {
  let store;
  
  function storePluginInit() {
    if (Array.isArray(host)) {
      store = new redis.Cluster(host);
    }
    else store = new redis(host);

    store.on('error', (err) => console.error(err));
  };

  storePluginInit();

  return (config) => {
    async function get(key) {
      const [err, res] = await store.get(`${localKey}:${key}`);
      if (err || res === null) return undefined;
      return JSON.parse(res);
    }

    async function getMulti(recordKey, keys) {
      const b = store.pipeline();

      keys.forEach((id) => {
        if (id !== undefined) {
          b.get(`${localKey}:${recordKey(id)}`);
        }
      });

      const replies = await b.exec();

      for (let i = 0; i < replies.length; i++) {
        const [err, res] = replies[i];
        const index = keys.findIndex(id => id !== undefined);
        if (index > -1) {
          if (err === null && res !== null) keys[index] = JSON.parse(res);
          else keys[index] = undefined;
        }
      }
      return keys;
    }

    function set(recordKey, keys, values) {
      const b = store.pipeline();

      keys.forEach((id) => {
        b.set(`${localKey}:${recordKey(id)}`, JSON.stringify(values[id]), 'PX', config.cache.ttl);
      });
      return b.exec();
    }

    function clear(key) {
      return !!store.del(`${localKey}:${key}`);
    }

    function size() {
      return 0;
    }

    return { get, getMulti, set, clear, size };
  };
}
  
/* Exports -------------------------------------------------------------------*/

module.exports = redisStore;
