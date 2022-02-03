const multer = require('multer');

const uploadPath = process.env.UPLOAD_PATH;

// multer upload configuration on server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    }, filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);  // use date for unique filename
    }
});
module.exports = multer({storage: storage});
