import {format} from 'util';
import {Storage} from '@google-cloud/storage';

const storage = new Storage({ keyFilename: "gcp-storage-upload.json" });

export const gcpUpload = function (req) {
  return new Promise((resolve, reject) => {
    const bucket = storage.bucket(req.params.bucket);

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', err => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      console.log(`${req.file.originalname} - Uploaded the file successfully`);
      resolve({
        message: "Uploaded the file successfully: " + req.file.originalname,
        fileLocation: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  })
}