const path = require('path')
const fs = require('fs')
const csv = require('csvtojson')

exports.postCsv = (req, res, next) => {
  if(!req.file) {
    return res.status(200).json({message: 'No file provided!'})
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  console.log(req)
  csv()
    .fromFile(req.file.path)
    .then(jsonObj => {
      console.log(jsonObj)
      return res.send(jsonObj)
    })
    .then(result => {
      clearImage(req.file.path);
    })
    .catch(err => console.log(err))
  // return res
  //   .status(201)
  //   .json({ message: 'File stored.', filePath: req.file.path });
}


const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
  console.log('file cleared')
};