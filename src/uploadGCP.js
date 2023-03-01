import { Storage } from '@google-cloud/storage';
import stream from 'stream'

const storage = new Storage({ keyFilename: "gcp-storage-upload.json" });

export const gcpUpload = function (req) {
  return new Promise((resolve, reject) => {
    const bucket = storage.bucket(req.params.bucket);

    const blob = bucket.file(req.file.originalname);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(req.file.buffer);
    passthroughStream.end();

    passthroughStream.pipe(blob.createWriteStream())
      .on('finish', () => {
        console.log(`${req.file.originalname} uploaded sucessfully`);

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve({
          message: "Uploaded the file successfully: " + req.file.originalname,
          fileLocation: publicUrl,
        });
      });
  })
}