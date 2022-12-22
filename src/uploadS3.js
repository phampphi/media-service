const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = new aws.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

aws.config.update({
  secretAccessKey: process.env.S3_ACCESS_SECRET,
  accessKeyId: process.env.S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/wav") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only audio file is allowed!"), false);
  }
};

const upload = multer({
  fileFilter,
  storage: multerS3({
    s3: s3,
    bucket: function (req, file, cb) {
      console.log("request bucket: ", req);
      cb(null, req.query.bucket);
    },
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, Object.assign({}, req.body));
    },
    key: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

exports.s3Upload = upload; 