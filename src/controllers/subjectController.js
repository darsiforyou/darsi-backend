const Subject = require("../models/subject");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");

const getAllSubjects = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Subject.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = Subject.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Subject.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Subjects",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllSubjectWithoutFilter = async (req, res) => {
  try {
    const subjects = await Subject.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "subject",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          products: { $size: "$products" },
          imageId: 1,
          imageURL: 1,
          isActive: 1,
        },
      },
    ]);
    return res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addSubject = async (req, res) => {
  try {
    const { title, isActive } = req.body;
    const file = req.file;
    let data = await Subject.create({
      title,
      isActive,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Subject",
      });
      data = await Subject.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your subject has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).send({ error: "Subject not found" });
    return res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Subject has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateSubject = async (req, res) => {
  try {
    const { title, isActive } = req.body;
    const file = req.file;
    let data = await Subject.findByIdAndUpdate(req.params.id, {
      title,
      isActive,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await Subject.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Subject has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllSubjects,
  getSubject,
  addSubject,
  deleteSubject, 
  getAllSubjectWithoutFilter,
  updateSubject,
};
