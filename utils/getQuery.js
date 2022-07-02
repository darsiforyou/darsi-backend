function getQuery(query) {
  return Object.keys(query).forEach((key) => {
    if (query[key] === null) {
      delete query[key];
    }
  });
}

module.exports = getQuery;
