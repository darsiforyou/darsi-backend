const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

function getQuery(query) {
  let obj = {};
  Object.keys(query).forEach((key) => {
    if (
      query[key] !== null &&
      query[key] !== "" &&
      query[key] !== undefined &&
      query[key] !== "null"
    ) {
      obj[key] = query[key];
    }
  });
  if (obj["category"]) {
    obj["category"] = ObjectId(obj["category"]);
  }
  if (obj["targetAge"]) {
    obj["targetAge"] = parseInt(obj["targetAge"]);
  }
  if (obj["brand"]) {
    obj["brand"] = ObjectId(obj["brand"]);
  }
  if (obj["vendor"]) {
    obj["vendor"] = ObjectId(obj["vendor"]);
  }
  if (obj["user"]) {
    obj["user"] = ObjectId(obj["user"]);
  }
  if (obj["userId"]) {
    obj["userId"] = ObjectId(obj["userId"]);
  }
  return obj;
}
module.exports = getQuery;
