const mongoose = require("mongoose");
const UserBankAccount = require("../models/user_bank_account");
const { getQuery, searchInColumns } = require("../utils");
const ObjectId = mongoose.Types.ObjectId;

const createAccount = async (req, res) => {
  try {
    const { id } = req.params.id;
    const { title, type, bankName, account_number, iban } = req.body;
    const accounts = await UserBankAccount.create({
      title,
      user: new ObjectId(id),
      type,
      bankName,
      account_number,
      iban,
    });
    return res.status(200).send({
      message: "Account details added successfully",
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};

const getAccountsByUserId = async (req, res) => {
  const { id } = req.params.id;
  const accounts = await UserBankAccount.find({ user: new ObjectId(id) });
  return res.status(200).send({
    message: "Successfully fetch Accounts of user " + id,
    data: accounts,
  });
};

const getAllAccounts = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [queries] } },
      ]);
    } else {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: +page || 1,
      limit: +limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await UserBankAccount.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetched accounts",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAccountsByUserId,
  createAccount,
  getAllAccounts,
};
