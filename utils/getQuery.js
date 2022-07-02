// function getQuery(query) {
//   return Object.keys(query).forEach((key) => {
//     if (!query[key]) {
//       delete query[key];
//     }
//   });
// }
function getQuery(query) {
  let obj = {};
  Object.keys(query).forEach((key) => {
    if (query[key] !== null && query[key].length > 0) {
      obj = query;
    }
  });
  return obj;
}
module.exports = getQuery;
