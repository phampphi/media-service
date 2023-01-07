import Multer from 'multer';

const maxUpload = process.env.maxUpload || 5;
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "audio/mpeg" || file.mimetype === "audio/wav" || file.mimetype === "audio/wave") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only audio file is allowed!"), false);
    }
  };
export const multer = Multer({
    storage: Multer.memoryStorage(),
    fileFilter,
    limits: {
      fileSize: maxUpload * 1024 * 1024, 
    },
});