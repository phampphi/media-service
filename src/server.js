import express from 'express';
import helmet from "helmet";
import cors from 'cors';
import { expressjwt } from 'express-jwt';
// import { s3Upload } from './uploadS3.js';
import { gcpUpload } from './uploadGCP.js';
import { sendEmail } from './sendEmail.js';
import { multer } from './multer.js';
import { dictation } from './wit.js';
import { analyseText, calculateVocabRange } from './textAnalysis.js';
import { scoreEssay, scoreSWT, scoreSST, scoreRA, scoreRS, scoreDI, scoreRL, scoreASQ, analyseRA } from './aiScoring.js';
import { generatePTEReport } from './pteReport.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV != 'development') {
  app.use(
    expressjwt({
      secret: process.env.JWT_SECRET,
      issuer: process.env.JWT_ISSUER,
      algorithms: ["HS256"],
    }).unless({ path: ["/", "/services", "/services/pte/report"] })
  );
}

// app.post('/services/upload/s3', s3Upload.single('file'), (req, res) => {
//   res.status(200).json({ success: true, fileLocation: req.file.location });
// });

/** API to upload the audio answer to GCP bucket */
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
    console.log(err.message);
    res.status(500).send(err);
  }
});

/** API to upload the audio answer to GCP bucket and provid dictation text. */
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

    res.status(result.status).send({ ...uploadResult, result: result });
  }
  catch (err) {
    console.log(err.message);
    res.status(500).send(err);
  }
});

/** API to send notification that the task has been completed. */
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

/** API to analyse the audio answer and provide dictation text. */
app.post('/services/speech/analysis', multer.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  dictation(req.file)
    .then(result => res.status(result.status).send({ result: result }))
    .catch(e => res.status(500).send(e));
});

/** API to analyse the text answer, check grammar, and access vocabulary. */
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

/** API to generate score and feedback from AI model for PTE Essay task. */
app.post('/services/scoring/essay', (req, res) => {
  if (!req.body.text || !req.body.topic) {
    res.status(400).send('Text or Topic is required.');
    return;
  }
  scoreEssay(req.body.topic, req.body.text)
    .then(result => {
      res.status(200).send(result);
    })
    .catch(e => { console.log('scoring essay error: ', e); res.status(500).send(e); });
});

/** API to generate score and feedback from AI model for PTE Summary Written Text task. */
app.post('/services/scoring/swt', (req, res) => {
  if (!req.body.text || !req.body.topic) {
    res.status(400).send('Topic or Answer Text is required.');
    return;
  }
  scoreSWT(req.body.topic, req.body.text)
    .then(result => {
      res.status(200).send(result);
    })
    .catch(e => { console.log('scoring SWT error: ', e); res.status(500).send(e); });
});

/** API to generate score and feedback from AI model for PTE Summary Spoken Text task. */
app.post('/services/scoring/sst', (req, res) => {
  if (!req.body.text || !req.body.audioTranscript) {
    res.status(400).send('AudioTranscript or Answer Text is required.');
    return;
  }
  scoreSST(req.body.audioTranscript, req.body.text)
    .then(result => {
      res.status(200).send(result);
    })
    .catch(e => { console.log('scoring SST error: ', e); res.status(500).send(e); });
});

/** API to generate score and feedback from AI model for PTE Read Aloud task. */
app.post('/services/scoring/ra/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.audioTranscript) {
    res.status(400).send('AudioFile or Transcript is required.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const resultAI = await scoreRA(req.body.audioTranscript, req.file);
    res.status(200).send({ ...uploadResult, result: resultAI });
  }
  catch (e) { console.log('scoring RA error: ', e); res.status(500).send(e); }
});

/** API to perform pronunciation analysis for PTE Read Aloud task. */
app.post('/services/analysis/ra', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.audioTranscript) {
    res.status(400).send('AudioFile or Transcript is required.');
    return;
  }

  try {
    const resultAI = await analyseRA(req.body.audioTranscript, req.file);
    res.status(200).send({ result: resultAI });
  }
  catch (e) { console.log('RA pronunciation analysis error: ', e); res.status(500).send(e); }
});

/** API to generate score and feedback from AI model for PTE Repeat Sentence task. */
app.post('/services/scoring/rs/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.audioTranscript) {
    res.status(400).send('AudioFile or Transcript is required.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const resultAI = await scoreRS(req.body.audioTranscript, req.file);
    res.status(200).send({ ...uploadResult, result: resultAI });
  }
  catch (e) { console.log('scoring RS error: ', e); res.status(500).send(e); }
});

/** API to generate score and feedback from AI model for PTE Describe Image task. */
app.post('/services/scoring/di/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.imageUri) {
    res.status(400).send('AudioFile or ImageUri is required.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const resultAI = await scoreDI(req.body.imageUri, req.file);
    res.status(200).send({ ...uploadResult, result: resultAI });
  }
  catch (e) { console.log('scoring DI error: ', e); res.status(500).send(e); }
});

/** API to generate score and feedback from AI model for PTE Retell Lecture task. */
app.post('/services/scoring/rl/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.audioTranscript) {
    res.status(400).send('AudioFile or AudioTranscript is required.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const resultAI = await scoreRL(req.body.audioTranscript, req.file);
    res.status(200).send({ ...uploadResult, result: resultAI });
  }
  catch (e) { console.log('scoring RL error: ', e); res.status(500).send(e); }
});

/** API to generate score and feedback from AI model for PTE Answer Short Question task. */
app.post('/services/scoring/asq/:bucket', multer.single('file'), async (req, res) => {
  if (!req.file || !req.body.sampleAnswer) {
    res.status(400).send('AudioFile or sampleAnswer is required.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  try {
    const uploadResult = await gcpUpload(req);
    const resultAI = await scoreASQ(req.body.sampleAnswer, req.file);
    res.status(200).send({ ...uploadResult, result: resultAI });
  }
  catch (e) { console.log('scoring ASQ error: ', e); res.status(500).send(e); }
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
  server.close(() => {
    console.log('HTTP server closed');
  })
})