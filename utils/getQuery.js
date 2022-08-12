function getQuery(query) {
  let obj = {};
  Object.keys(query).forEach((key) => {
    if (query[key] !== null && query[key] !== "" && query[key] !== undefined && query[key] !== "null") {
      obj[key] = query[key];
    }
  });
  return obj;
}
module.exports = getQuery;
