function searchInColumns(search, columns) {
  let searchExp = search ? new RegExp(search.toLowerCase(), "i") : "";
  const arr = columns.map((column) => {
    return {
      [column]: searchExp,
    };
  });
  return arr;
}

module.exports = searchInColumns;
