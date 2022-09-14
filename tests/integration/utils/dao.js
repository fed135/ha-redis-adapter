function getAssets(ids, { language }) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ids.reduce((acc, id) => {
      acc[id] = { id, language };
      return acc;
    }, {})), (ids.length > 1) ? 130 : 100);
  });
}

function getEmptyGroup(ids, { language }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve([]), 10);
  });
}

function getPartialGroup(ids, { language }) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ [ids[0]]: { id: ids[0], language }}), 5);
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
