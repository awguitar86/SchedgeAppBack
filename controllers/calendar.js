const path = require('path');
const fs = require('fs');
const csv = require('csvtojson');

// This is the only controller we're using because all we're doing in the server is converting the CSV file to JSON.
exports.postCsv = (req, res, next) => {
  console.log(req.file);
  if (!req.file) {
    // If no file is provided it will throw and error.
    return res.status(200).json({ message: 'No file provided!' });
  }
  if (req.body.oldPath) {
    // This is for clearing any old files in the 'csvFile' folder. We don't need to keep the files after they've been converted to JSON.
    clearImage(req.body.oldPath);
  }
  console.log(req);
  // This is to make sure we get the correct file path both on Mac and Windows.
  const csvFilePath = req.file.path.includes('\\')
    ? req.file.path.replace('\\', '/')
    : req.file.path;
  csv() // This is the csv to json converter
    .fromFile(csvFilePath) // Needs correct file path to access the file, read it, and convert it to json. This is a promise.
    .then((jsonObj) => {
      // Then once it finishes converting the file to json, we get the return object which is the json data.
      console.log(jsonObj);
      return res.send(jsonObj); // This send the json object in the response object.
    })
    .then((result) => {
      clearImage(req.file.path); // This then clears the file that was just uploaed from the 'csvFiles' folder because we don't need to keep it.
    })
    .catch((err) => console.log(err));
  // return res
  //   .status(201)
  //   .json({ message: 'File stored.', filePath: req.file.path });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath); // This is getting the correct path to the file in the 'csvFiles' folder.
  fs.unlink(filePath, (err) => console.log(err)); // This unliks the file from the file system.
  console.log('file cleared');
};
