const express = require('express');
const helmet = require("helmet");
const cors = require('cors');
const { s3Upload } = require('./uploadS3.js');
const { gcpUpload, multer } = require('./uploadGCP.js');
const { sendEmail } = require('./sendEmail.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/services/upload/s3', s3Upload.single('file'), (req, res) => {
  res.status(200).json({ success: true, fileLocation: req.file.location });
});

app.post('/services/upload/gcp/:bucket', multer.single('file'), (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }
  if (!req.params.bucket) {
    res.status(400).send('No bucket found.');
    return;
  }

  gcpUpload(req, res, next);
});

app.post('/services/notify/completion', async(req, res)=>{
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
      res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('Running');
});

app.get('/services', (req, res) => {
  res.send('Running');
});

// Start the server
app.listen(port, function(err){
  if(err){
   console.log("Server Error: ",err);
 }else{
   console.log('Server started: ', port);
 }
});