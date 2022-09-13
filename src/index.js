const redis = require('redis');

function Redis(localKey, host, connection) {
  return (config) => {
    let instance = connection || redis.createClient(host);
    instance.connect();

    return {
      get: get(localKey, instance),
      getMulti: getMulti(localKey, instance),
      set: set(localKey, instance, config),
      clear: clear(localKey, instance),
      size: size(instance),
      store: instance,
    };
  }
}

function get(localKey, instance) {
  return (key) => {
    return instance.get(`${localKey}:${key}`);
  };
}

function getMulti(localKey, instance) {
  return (recordKey, keys) => {
    return new Promise((resolve) => {
      const b = instance.multi();

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

function set(localKey, instance, config) {
  return (recordKey, keys, values) => {
    const b = instance.multi();

    keys.forEach((id) => {
      b.set(`${localKey}:${recordKey(id)}`, JSON.stringify(values[id]), 'PX', config.ttl || config.cache.ttl || 0);
    });
    return b.exec();
  }
}

function clear(localKey, instance) {
  return (key) => {
    if (key === '*') return instance.sendCommand('FLUSHDB');
    return instance.del(`${localKey}:${key}`);
  }
}

function size(instance) {
  return new Promise((resolve, reject) => {
    instance.sendCommand('DBSIZE', null, (err, res) => {
      if (err) reject(err);
      resolve(res);
    });
  });
}

module.exports = Redis;
