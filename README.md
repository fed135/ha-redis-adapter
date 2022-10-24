<h1 align="center">
  <img alt="HA-store" width="300px" src="./logo.png" />
  <br/>
  High-Availability store
</h1>
<h3 align="center">
  Efficient data fetching
  <br/><br/><br/>
</h3>
<br/>

[![ha-store-redis](https://img.shields.io/npm/v/ha-store-redis.svg)](https://www.npmjs.com/package/ha-store-redis)
[![Dependencies Status](https://david-dm.org/fed135/ha-store-redis.svg)](https://david-dm.org/fed135/ha-store-redis)

---

A redis storage plugin for [ha-store](https://www.npmjs.com/package/ha-store).

## Installing

`npm install ha-store-redis`


## Usage

**Store**
```node
const store = require('ha-store');
const local = require('ha-store/stores/in-memory');
const remote = require('ha-store-redis');

// v4.x.x
const itemStore = store({
  resolver: getItems,
  cache: {
    enabled: true,
    tiers: [
      {store: local},
      {store: remote('my_namespace', '//0.0.0.0:6379')},
    ],
  },
});

// v3.x.x
const itemStore = store({
  resolver: getItems,
  store: remote('my_namespace', '//0.0.0.0:6379'),
});
```

It now also supports passing an existing connection object.

```node
const redis = require('redis');
const store = require('ha-store');
const remote = require('ha-store-redis');

const client = redis.createClient('//0.0.0.0:6379');

const itemStore = store({
  resolver: getItems,
  store: remote('my_namespace', null, client),
});
```


## Testing

`npm test`

## Compatibility

This is backwards-compatible with v3.x.x of ha-store. 

## Contribute

Please do! This is an open source project - if you see something that you want, [open an issue](https://github.com/fed135/ha-redis-adapter/issues/new) or file a pull request.

If you have a major change, it would be better to open an issue first so that we can talk about it. 

I am always looking for more maintainers, as well. Get involved. 


## License 

[Apache 2.0](LICENSE) (c) Frederic Charette

