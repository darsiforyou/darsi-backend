const mongoose = require("mongoose");
const Financial = require("../models/financial");
const PaymentRequest = require("../models/payment_requests");
const { getQuery } = require("../utils");
const ObjectId = mongoose.Types.ObjectId;

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
      message: "Successfully fetch Financial",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllRequests = async (req, res) => {
  try {
    let { page, limit, ...queries } = req.query;
    queries = getQuery(queries);
    let myAggregate = PaymentRequest.aggregate([{ $match: { $and: [queries] } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
      // {
      //   $lookup: {
      //     from: "financials",
      //     localField: "",
      //     foreignField: "_id",
      //     as: "order",
      //   },
      // },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };
    const data = await PaymentRequest.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Financial",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getRevenueTotal = async (req, res) => {
  try {
    let {darsi} = req.query
    console.log(darsi);

    let filter = {}
    if(darsi){
      filter['darsi'] = true
    }else{
      filter['user'] = ObjectId(req.params.id)
    }
    console.log(filter);

    const TF = await Financial.aggregate([
      {
        '$match': filter
      }, {
        '$group': {
          '_id': '',
          'total': { '$sum': '$amount' }
        }
      }
    ])
    const TPR = await PaymentRequest.aggregate([
      {
        '$match': {status: "Accepted", ...filter}
      }, {
        '$group': {
          '_id': '',
          'amountAccepted': {
            '$sum': '$amountAccepted'
          },
          'amountRequested': {
            '$sum': '$amountRequested'
          },
        }
      }
    ])

    let financial = {}
    let paymentRequest = {}
   
    await (TF || []).forEach(async (x) => {
      financial['total'] = await x.total
    });
    await (TPR || []).forEach(async (x) => {
      paymentRequest = await { amountAccepted: x.amountAccepted, amountRequested: x.amountRequested };
    });

    const data = {
      walletAmount: (financial.total-paymentRequest.amountAccepted||0),
      withdraw: (paymentRequest.amountAccepted||0)
    }

    return res.status(200).send({
      message: "Successfully fetch Financial Total",
      data
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
const makePaymentRequest = async (req, res) => {
  try {
    const { user, darsi, amount } = req.body;
    await PaymentRequest.create({ user, darsi: darsi ? darsi : false, amountRequested: amount })

    res.status(200).json({ message: "Request has been send to the admin" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const acceptPaymentRequest = async (req, res) => {
  try {
    const id = req.params.id;
    let request = await PaymentRequest.findById(id)
    if (request._id) {
      await PaymentRequest.findByIdAndUpdate(id, { status: "Accepted" })
    }
    res.status(200).json({ message: "Request Accepted" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const rejectPaymentRequest = async (req, res) => {
  try {
    const id = req.params.id;
    let request = await PaymentRequest.findById(id)
    if (request._id) {
      await PaymentRequest.findByIdAndUpdate(id, { status: "Rejected" })
    }
    res.status(200).json({ message: "Request Rejected" });
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
  makePaymentRequest,
  getRevenueTotal,
  getAllRequests,
  acceptPaymentRequest,
  rejectPaymentRequest
};
