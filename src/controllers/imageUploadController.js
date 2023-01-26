const { faker } = require("@faker-js/faker");
const imagekit = require("../config/imagekit");


const uploadImage = async (req, res) => {
    try {
        const file = req.file;

        let image = null
        if (file) {
            image = await imagekit.upload({
                file: file.buffer, //required
                fileName: file.originalname, //required
                folder: "/Products",
            });
        }


        res.status(200).json({
            message: "Your product has been Added Successfully.",
            image,
        });
    } catch (err) {
        res.status(500).json(err);
    }
};


module.exports = {
    uploadImage,
};
