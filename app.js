const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const port = 8080;

const calendarRoutes = require('./routes/calendar');

const app = express();

app.use(cors());

// This is to store the uploaded file in the 'csvfiles' folder on the server. We use multer to help us do this.
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'csvFiles');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// This is to make sure the uploaded file is the right file type. If it's not it will not store the file.
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json()); // application/json

// This is using the multer package and telling it where to store the file and what file type will be uploaded.
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single('csvfile') // This is saying that we're only accepting one single file, not multiple files.
);
app.use('/csvFiles', express.static(path.join(__dirname, 'csvFiles'))); // This is just getting the correct path to the 'csvfile' folder where we are storing the uploaded file.

app.use('/calendar', calendarRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

app.listen(port, () => {
  console.log(
    `=================================\nServer is listening on port ${port}.\n=================================`
  );
});
