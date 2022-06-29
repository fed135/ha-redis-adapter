const redis = require('redis');

function Redis({ connection, localKey, host }) {
  return (config) => {
    let store = connection || redis.createClient(host);

    return {
      getMulti: getMulti(localKey, store),
      set: set(localKey, store, config),
      clear: clear(localKey, store),
      size: size(store),
      store,
    };
  }
}

function getMulti(localKey, store) {
  return (recordKey, keys) => {
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
}

function set(localKey, store, config) {
  return (recordKey, keys, values) => {
    const b = store.multi();

    keys.forEach((id) => {
      b.set(`${localKey}:${recordKey(id)}`, JSON.stringify(values[id]), 'PX', config.cache.ttl);
    });
    return b.exec();
  }
}

function clear(localKey, store) {
  return (key) => !!store.del(`${localKey}:${key}`);
}

function size(store) {
  return () => store.sendCommand(['info', 'keyspace'])
    .then((reply) => console.log(reply) && reply);
}

module.exports = Redis;
