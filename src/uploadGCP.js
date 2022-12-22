const {format} = require('util');
const Multer = require('multer');
const {Storage} = require('@google-cloud/storage');

const maxUpload = process.env.maxUpload || 5;
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/wav") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only audio file is allowed!"), false);
    }
  };
const multer = Multer({
    storage: Multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: maxUpload * 1024 * 1024, 
    },
});

const storage = new Storage({ keyFilename: "gcp-storage-upload.json" });

const upload = function (req, res, next) {
    const bucket = storage.bucket(req.params.bucket);

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream();
  
    blobStream.on('error', err => {
      next(err);
    });
  
    blobStream.on('finish', async () => {
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      /*
      try {
        // Make the file public
        await bucket.file(req.file.originalname).makePublic();
      } catch {
        console.log(`${req.file.originalname} - public access is denied`);
        return res.status(500).send({
          message: `Uploaded the file successfully: ${req.file.originalname}, but public access is denied!`,
          fileLocation: publicUrl,
        });
      }*/

      console.log(`${req.file.originalname} - Uploaded the file successfully`);
      res.status(200).send({
        message: "Uploaded the file successfully: " + req.file.originalname,
        fileLocation: publicUrl,
      });
    });
  
    blobStream.end(req.file.buffer);
}


exports.gcpUpload = upload; 
exports.multer = multer; 