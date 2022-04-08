const mongodb = require('mongodb');
const {MongoClient} = mongodb;
const fs = require('fs');
const express = require('express');
const app = express();

// Connection URL
const url = `mongodb+srv://spaghetti:${process.env.MONGO_PW}@igcluster.u0lmv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(url);

const upload = async function (req, res) {

  const fileName = req.query.name;
  const filePath = req.query.path;
  console.log(fileName, filePath);

  mongodb.MongoClient.connect(url, function (error, client) {
    if (error) {
      console.log(error);
      return;
    }

    // connect to the videos database
    const db = client.db('videos');
    console.log('makin db');

    // Create GridFS bucket to upload a large file
    const bucket = new mongodb.GridFSBucket(db);

    // create upload stream using GridFS bucket
    const videoUploadStream = bucket.openUploadStream(fileName);
    console.log('streamin video');

    // You can put your file instead of bigbuck.mp4
    const videoReadStream = fs.createReadStream(filePath);
    console.log('made stream');

    // Finally Upload!
    videoReadStream.pipe(videoUploadStream);
    console.log('piped');

    // All done!
    res.status(200).send('done');
  });
}

const download = async (req, res) => {
    try {
      await client.connect();
      const database = client.db('videos');
      const bucket = new mongodb.GridFSBucket(database);
      let downloadStream = bucket.openDownloadStreamByName(req.params.name);
      downloadStream.on("data", function (data) {
        return res.status(200).write(data);
      });
      downloadStream.on("error", function (err) {
        return res.status(404).send({ message: "Cannot download the Image!" });
      });
      downloadStream.on("end", () => {
        bucket.find({filename: req.params.name}).toArray(function(err, files) {
            console.error(err);
            //delete files[0];
            bucket.delete(files[0]._id);
        });
        return res.end();
      });
    } catch (error) {
      return res.status(500).send({
        message: error.message,
      });
    }
  };  

app.get('/file/:name', download);
app.get('/upload', upload);
app.listen(process.env.PORT || 3000, () => console.log(`single upload app listening on port ${process.env.PORT || 3000}!`));