const mongoose = require("mongoose");
const UserBankAccount = require("../models/user_bank_account");
const { getQuery, searchInColumns } = require("../utils");
const ObjectId = mongoose.Types.ObjectId;

const createAccount = async (req, res) => {
  try {
    const { title, type, bankName, account_number, holderName, iban, user } =
      req.body;
    const accounts = await UserBankAccount.create({
      title,
      user: new ObjectId(user),
      type,
      bankName,
      account_number,
      iban,
    });
    return res.status(200).send({
      message: "Account details added successfully",
      data: accounts,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getAccountsByUserId = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    const id = req.params.userId;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    const lookup = {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    };
    queries = { user: ObjectId(id), ...queries };
    if (!search) {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [queries] } },
        lookup,
      ]);
    } else {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        lookup,
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

const getAllAccounts = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    const lookup = {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    };
    if (!search) {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [queries] } },
        lookup,
      ]);
    } else {
      myAggregate = UserBankAccount.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        lookup,
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

const deleteAccount = async (req, res) => {
  try {
    await UserBankAccount.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Account has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateAccount = async (req, res) => {
  try {
    const { title, type, bankName, account_number, holderName, iban, user } =
      req.body;
    const id = req.params.id;
    const accounts = await UserBankAccount.findByIdAndUpdate(id, {
      title,
      user: new ObjectId(user),
      type,
      bankName,
      account_number,
      iban,
    });
    return res.status(200).send({
      message: "Account details added successfully",
      data: accounts,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
module.exports = {
  getAccountsByUserId,
  deleteAccount,
  createAccount,
  getAllAccounts,
  updateAccount,
};
