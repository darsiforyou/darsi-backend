const MLMBilling = require('../models/mlm-billing');
const { getQuery } = require('../utils');

const createMLMBilling = async (req, res) => {
  try {
    let { userId, amount, paymentType, refferalId } = req.body;

    const sale = new MLMBilling({
      userId,
      amount,
      paymentType,
      refferalId
    });
    const data = await sale.save();
    return res.status(200).send({
      message: 'Successfully saved',
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllMLMBilling = async (req, res) => {
  try {
    let {
      page, limit, search, ...queries
    } = req.query;
    //   search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = MLMBilling.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = MLMBilling.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    // const data = await Billing.aggregatePaginate(myAggregate, options);
    const data = await MLMBilling.find();

    return res.status(200).send({
      message: 'Successfully fetch MLM Billing',
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  createMLMBilling,
  getAllMLMBilling,
};
