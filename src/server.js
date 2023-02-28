import express from 'express';
import helmet from "helmet";
import cors from 'cors';
import { expressjwt } from 'express-jwt';
import { s3Upload } from './uploadS3.js';
import { gcpUpload } from './uploadGCP.js';
import { sendEmail } from './sendEmail.js';
import { multer } from './multer.js';
import { dictation } from './wit.js';
import { analyseText, calculateVocabRange } from './textAnalysis.js';
import { generatePTEReport, releasePool, generatePDF } from './pteReport.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(
  expressjwt({
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER,
    algorithms: ["HS256"],
  }).unless({ path: ["/", "/services"] })
);

app.post('/services/upload/s3', s3Upload.single('file'), (req, res) => {
  res.status(200).json({ success: true, fileLocation: req.file.location });
});

app.post('/services/upload/gcp/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const result = await gcpUpload(req);
    res.status(200).send(result);
  }
  catch (err) {
    res.status(500).send(err);
  }
});

app.post('/services/scoring/gcp/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const result = await dictation(req.file);
    // const result = { text: 'dummy', confidence: 0.8, status: 200 };

    res.status(result.status).send({ ...uploadResult, result: result });
  }
  catch (err) {
    res.status(500).send(err);
  }
});

app.post('/services/notify/completion', async (req, res) => {
  try {
    await sendEmail({
      to: req.body.to,
      from: req.body.from || process.env.SENDGRID_MAIL_FROM,
      templateId: req.body.templateId,
      dynamicTemplateData: req.body.dynamicTemplateData,
    });
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.post('/services/speech/analysis', multer.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  dictation(req.file)
    .then(result => res.status(result.status).send({ result: result }))
    .catch(e => res.status(500).send(e));
});

app.post('/services/text/analysis', (req, res) => {
  if (!req.body.text) {
    res.status(400).send('Text is required.');
    return;
  }
  // res.status(200).send({ grammar: 0, vocabulary: 0, spelling: 0 });
  analyseText(req.body.text)
    .then(result => {
      if (req.body.vocabularyRange == 'true') result.vocabularyRange = calculateVocabRange(req.body.text);
      res.status(200).send(result);
    })
    .catch(e => res.status(500).send(e));
});

app.get('/services/pte/report', async (req, res) => {
  if (!req.query.userId) {
    res.status(400).send('No userId found.');
    return;
  }
  if (!req.query.activityIds) {
    res.status(400).send('No activityIds found.');
    return;
  }
  try {
    const report = await generatePTEReport(req.query.userId, req.query.activityIds.split(','));
    res.status(200).contentType("application/pdf");
    res.send(Buffer.from(report));
  }
  catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.get('/', (req, res) => {
  res.send('Running');
});

app.get('/services', (req, res) => {
  res.send('Running');
});

// Start the server
const server = app.listen(port, function (err) {
  if (err) {
    console.log("Server Error: ", err);
  } else {
    console.log('Server started: ', port);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  releasePool();
  server.close(() => {
    console.log('HTTP server closed');
  })
})