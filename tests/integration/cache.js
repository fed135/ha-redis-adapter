/**
 * Caching feature integration tests
 */

/* Requires ------------------------------------------------------------------*/

const expect = require('chai').expect;
const sinon = require('sinon');
const dao = require('./utils/dao.js');
const ha = require('ha-store');
const redis = require('../../src/index.js');

/* Tests ---------------------------------------------------------------------*/

describe('Caching', () => {
  describe('Happy responses', () => {
    let testStore;
    let mockSource;
    afterEach((done) => {
      setTimeout(() => {
        testStore = null;
        mockSource.restore();
        done();
      }, 10);
    });
    beforeEach(() => {
      mockSource = sinon.mock(dao);
      testStore = ha({
        delimiter: ['language'],
        resolver: dao.getAssets,
        batch: {enabled: true},
        cache: {
          enabled: true,
          tiers: [
            {store: redis(Math.random() * 0xffffff, '//0.0.0.0:6379')},
          ],
        },
      });
    });

    it('should cache single values', () => {
      testStore.get('foo');
      return testStore.get('foo')
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo' });
          mockSource.expects('getAssets')
            .exactly(1)
            .withArgs(['foo', 'abc']);
        });
    });

    it('should cache multi values', () => {
      testStore.get(['abc', 'foo'])
      return testStore.get(['abc', 'foo'])
        .then((result) => {
          expect(result).to.deep.equal([{ id: 'abc' }, { id: 'foo' }]);
          mockSource.expects('getAssets')
            .exactly(1)
            .withArgs(['foo', 'abc']);
        });
    });

    it('should cache single values without batching', () => {
      testStore.config.batch.enabled = false;
      testStore.get('foo');
      return testStore.get('foo')
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo' });
          mockSource.expects('getAssets')
            .exactly(1)
            .withArgs(['foo', 'abc']);
        });
    });

    it('should cache multi values without batching', () => {
      testStore.config.batch.enabled = false;
      testStore.get(['abc', 'foo'])
      return testStore.get(['abc', 'foo'])
        .then((result) => {
          expect(result).to.deep.equal([{ id: 'abc' }, { id: 'foo' }]);
          mockSource.expects('getAssets')
            .exactly(1)
            .withArgs(['foo', 'abc']);
        });
    });

    it('should cache single calls with params', () => {
      testStore.get('foo', { language: 'fr' });
      return testStore.get('foo', { language: 'fr' })
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo', language: 'fr' });
          mockSource.expects('getAssets')
            .exactly(1)
            .withArgs(['foo'], { language: 'fr' });
        });
    });

    it('should not return cached values forunique params mismatches', () => {
      testStore.get('foo', { language: 'fr' });
      return testStore.get('foo', { language: 'en' })
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo' , language: 'en' });
          mockSource.expects('getAssets')
            .once()
            .withArgs(['foo'], { language: 'en' });
        });
    });

    it('should support disabled caching', () => {
      testStore.config.cache.enabled = false;
      testStore.get('foo');
      return testStore.get('foo')
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo' });
          mockSource.expects('getAssets')
            .once()
            .withArgs(['foo']);
        });
    });

    it('should support disabled caching and batching', () => {
      testStore.config.cache.enabled = false;
      testStore.config.batch.enabled = false;
      testStore.get('foo');
      return testStore.get('foo')
        .then((result) => {
          expect(result).to.deep.equal({ id: 'foo' });
          mockSource.expects('getAssets')
            .twice()
            .withArgs(['foo']);
        });
    });
  });

  describe('Empty responses', () => {
    let testStore;
    let mockSource;
    afterEach((done) => {
      setTimeout(() => {
        testStore = null;
        mockSource.restore();
        done();
      }, 10);
    });
    beforeEach(() => {
      mockSource = sinon.mock(dao);
      testStore = ha({
        delimiter: ['language'],
        resolver: dao.getEmptyGroup,
        batch: {enabled: true},
        cache: {
          enabled: true,
          tiers: [
            {store: redis(Math.random() * 0xffffff, '//0.0.0.0:6379')},
          ],
        },
      });
    });

    it('should cache empty single values', () => {
      testStore.get('foo');
      return testStore.get('abc')
        .then((result) => {
          expect(result).to.be.undefined;
          mockSource.expects('getEmptyGroup')
            .once()
            .withArgs(['foo', 'abc']);
        });
    });

    it('should batch empty multi values', () => {
      return testStore.get(['abc', 'foo'])
        .then((result) => {
          expect(result).to.deep.equal([undefined, undefined]);
          mockSource.expects('getEmptyGroup')
            .once()
            .withArgs(['foo', 'abc']);
        });
    });

    it('should support disabled batching', () => {
      testStore.config.batch.enabled = false;
      testStore.get('foo');
      return testStore.get('abc')
        .then((result) => {
          expect(result).to.be.undefined;
          mockSource.expects('getEmptyGroup')
            .once()
            .withArgs(['abc']);
        });
    });
  });

  describe('Partial responses', () => {
    let testStore;
    let mockSource;
    afterEach((done) => {
      setTimeout(() => {
        testStore = null;
        mockSource.restore();
        done();
      }, 10);
    });
    beforeEach(() => {
      mockSource = sinon.mock(dao);
      testStore = ha({
        delimiter: ['language'],
        resolver: dao.getPartialGroup,
        store: redis(Math.random() * 0xffffff, '//0.0.0.0:6379'),
      });
    });

    it('should cache all the results on mixed responses', () => {
      return testStore.get(['abc', 'foo', 'bar'])
        .then((result) => {
          expect(result).to.deep.equal([{ id: 'abc' }, undefined, undefined]);
          mockSource.expects('getPartialGroup')
            .once()
            .withArgs(['foo', 'bar', 'abc']);
        });
    });

    it('should support disabled batching', () => {
      testStore.config.batch.enabled = false;
      testStore.get('foo');
      return testStore.get('abc')
        .then((result) => {
          expect(result).to.deep.equal({ id: 'abc' });
          mockSource.expects('getPartialGroup')
            .once()
            .withArgs(['abc']);
        });
    });
  });

  describe('Rejected requests', () => {
    let testStore;
    let mockSource;
    afterEach((done) => {
      setTimeout(() => {
        testStore = null;
        mockSource.restore();
        done();
      }, 10);
    });
    beforeEach(() => {
      mockSource = sinon.mock(dao);
      testStore = ha({
        delimiter: ['language'],
        resolver: dao.getFailedRequest,
        store: redis(Math.random() * 0xffffff, '//0.0.0.0:6379'),
      });
    });

    it('should not cache failed requests', () => {
      return testStore.get('abc', { language: 'fr' })
        .then(null, (error) => {
          expect(error).to.deep.equal({ error: 'Something went wrong' });
          mockSource.expects('getFailedRequest')
            .once().withArgs(['abc'], { language: 'fr' });
        });
    });

    it('should not cache failed multi requests', () => {
      return testStore.get(['abc', 'foo'], { language: 'en' })
        .then(null, (error) => {
          expect(error).to.deep.equal({ error: 'Something went wrong' });
          mockSource.expects('getFailedRequest')
            .once().withArgs(['abc', 'foo'], { language: 'en' });
        });
    });

    it('should properly reject with disabled batching', () => {
      testStore.config.batch.enabled = false;
      return testStore.get('abc')
        .then(null, (error) => {
          expect(error).to.deep.equal({ error: 'Something went wrong' });
          mockSource.expects('getFailedRequest')
            .once()
            .withArgs(['abc']);
        });
    });
  });

  describe('Failed requests', () => {
    let testStore;
    let mockSource;
    afterEach((done) => {
      setTimeout(() => {
        testStore = null;
        mockSource.restore();
        done();
      }, 10);
    });
    beforeEach(() => {
      mockSource = sinon.mock(dao);
      testStore = ha({
        delimiter: ['language'],
        resolver: dao.getErroredRequest,
        store: redis(Math.random() * 0xffffff, '//0.0.0.0:6379'),
      });
    });

    it('should not cache on rejected requests', () => {
      testStore.config.retry = { base: 1, steps: 1, limit: 1 };
      return testStore.get('abc', { language: 'fr' })
        .then(null, (error) => {
          expect(error).to.be.instanceOf(Error).with.property('message', 'Something went wrong');
          mockSource.expects('getErroredRequest')
            .once().withArgs(['abc'], { language: 'fr' });
        });
    });

    it('should properly reject with disabled batching', () => {
      testStore.config.batch.enabled = false;
      return testStore.get('abc')
        .then(null, (error) => {
          expect(error).to.be.instanceOf(Error).with.property('message', 'Something went wrong');
          mockSource.expects('getErroredRequest')
            .once()
            .withArgs(['abc']);
        });
    });
  });
});