import { Storage } from '@google-cloud/storage';
import stream from 'stream'

const storage = new Storage({
  keyFilename: "gcp-storage-upload.json",
  retryOptions: {
    autoRetry: true,
    // The multiplier to increase the delay time between the completion of failed requests, and the initiation of the subsequent retrying request
    retryDelayMultiplier: 3,
    // The total time between an initial request getting sent and its timeout.
    totalTimeout: 500,
    // The maximum delay time between requests. When this value is reached, retryDelayMultiplier will no longer be used to increase delay time.
    maxRetryDelay: 60,
    // The maximum number of automatic retries attempted before returning the error.
    maxRetries: 5,
    //idempotencyStrategy: IdempotencyStrategy.RetryAlways,
  }
});

export const gcpUpload = function (req) {
  return new Promise((resolve, reject) => {
    console.log('Environment', process.env.NODE_ENV);
    if (process.env.NODE_ENV == 'development') {
      resolve({ message: "Uploaded the file successfully: ", fileLocation: "publicUrl" });
      return;
    }

    const bucket = storage.bucket(req.params.bucket);
    const blob = bucket.file(req.file.originalname);

    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(req.file.buffer);
    passthroughStream.end();

    passthroughStream.pipe(blob.createWriteStream())
      .on('finish', () => {
        console.log(`${req.file.originalname} uploaded successfully`);

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve({
          message: "Uploaded the file successfully: " + req.file.originalname,
          fileLocation: publicUrl,
        });
      });
  })
}