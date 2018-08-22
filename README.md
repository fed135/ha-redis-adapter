<h1 align="center">
  Redis adapter for HA-store
</h1>
<h3 align="center">
    Why not redis ?
  <br/><br/><br/>
</h3>
<br/>

[![ha-redis](https://img.shields.io/npm/v/ha-store-redis.svg)](https://www.npmjs.com/package/ha-store-redis)
[![Node](https://img.shields.io/badge/node->%3D8.0-blue.svg)](https://nodejs.org)
[![Build Status](https://travis-ci.org/fed135/ha-redis-adapter.svg?branch=master)](https://travis-ci.org/fed135/ha-redis-adapter)
[![Dependencies Status](https://david-dm.org/fed135/ha-store-redis.svg)](https://david-dm.org/fed135/ha-store-redis)

---

## Installing

`npm install ha-store-redis`


## Usage

**Store**
```node
const store = require('ha-store');
const redisStore = require('ha-store-redis')({ host: 'localhost:3386' });
const itemStore = store({ getter: { method: getItems }, store: redisStore });
```


## Testing

`npm test`


## Contribute

Please do! This is an open source project - if you see something that you want, [open an issue](https://github.com/fed135/ha-redis-adapter/issues/new) or file a pull request.

If you have a major change, it would be better to open an issue first so that we can talk about it. 

I am always looking for more maintainers, as well. Get involved. 


## License 

[Apache 2.0](LICENSE) (c) 2018 Frederic Charette

