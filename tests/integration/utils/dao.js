function getAssets(ids, { language }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(ids.map(id => {
      const rec = { id };
      if (language) rec.language = language;
      return rec;
    })), (ids.length > 1) ? 130 : 100);
  });
}

function getEmptyGroup(ids, { language }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve([]), 10);
  });
}

function getPartialGroup(ids, { language }) {
  return new Promise((resolve, reject) => {
    const rec = { id: ids[0] };
    if (language) rec.language = language;
    setTimeout(() => resolve([rec]), 5);
  });
}

function getErroredRequest(ids, { language }) {
  return new Promise((resolve, reject) => {
    throw new Error('Something went wrong');
  });
}

function getFailedRequest(ids, { language }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject({ error: 'Something went wrong' }), 10);
  });
}

module.exports = {
  getAssets,
  getEmptyGroup,
  getPartialGroup,
  getErroredRequest,
  getFailedRequest,
};
