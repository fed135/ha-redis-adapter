const redis = require('redis');

function Redis(localKey, host, connection) {
  return function RedisStore(config) {
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
    return instance.get(`${localKey}:${key}`)
  };
}

function getMulti(localKey, instance) {
  return (recordKey, keys) => {
    return instance.mGet(keys.map((id) => `${localKey}:${recordKey(id)}`));
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
    if (key === '*') return instance.sendCommand(['FLUSHDB']);
    return instance.del(`${localKey}:${key}`);
  }
}

function size(instance) {
  return () => instance.sendCommand(['DBSIZE']);
}

module.exports = Redis;
