const Financial = require("../models/financial");
const { getQuery } = require("../utils");

const getAllFinancials = async (req, res) => {
  try {
    let { page, limit, ...queries } = req.query;
    queries = getQuery(queries);
    let myAggregate = Financial.aggregate([{ $match: { $and: [queries] } },
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "order",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    }]);

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Financial.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Financials",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getFinancial = async (req, res) => {
  try {
    const financial = await Financial.findById(req.params.id);
    if (!financial) return res.status(404).send({ error: "Financial not found" });
    return res.json(financial);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const deleteFinancial = async (req, res) => {
  try {
    await Financial.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Financial has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};


module.exports = {
  getAllFinancials,
  getFinancial,
  deleteFinancial,
};
