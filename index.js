const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { json } = require("body-parser");
const { ObjectId } = require("mongodb");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wghoc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const appointCollection = client
    .db(process.env.DB_NAME)
    .collection("appointments");

  // patient part

  app.post("/appointmentData", (req, res) => {
    const data = req.body;
    appointCollection.insertOne(data).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //doctor's dashboard part
  app.get("/petient", (req, res) => {
    const { id } = req.query;

    if (id !== "null") {
      appointCollection.findOne({ _id: ObjectId(id) }).then((result) => {
        res.send(result);
      });
    }
  });

  app.get("/dashboard", (req, res) => {
    const { date } = req.query;
    if (date) {
      appointCollection.find({ date }).toArray((err, docs) => {
        res.send(docs);
      });
    } else {
      appointCollection.find({}).toArray((err, docs) => {
        res.send(docs);
      });
    }
  });

  app.patch("/prescribe", (req, res) => {
    const { id } = req.query;
    let prescription = [];
    appointCollection
      .findOne({ _id: ObjectId(id) })
      .then((result) => {
        if (result.prescription) {
          prescription.push(...result.prescription, req.body);
        } else {
          prescription.push(req.body);
        }
      })
      .then(() => {
        appointCollection
          .updateOne(
            { _id: ObjectId(id) },
            { $set: { prescription: prescription } }
          )
          .then((result) => {
            if (result) {
              res.send(true);
            }
          });
      });
  });

  app.patch("/removeMedicine", (req, res) => {
    const { ind, id } = req.query;
    appointCollection.findOne({ _id: ObjectId(id) }).then((result) => {
      if (result) {
        let prescription = result.prescription;
        prescription.splice(parseInt(ind), 1);
        appointCollection
          .updateOne({ _id: ObjectId(id) }, { $set: { prescription } })
          .then((upRes) => {
            res.send(upRes.modifiedCount > 0);
          })
          .catch(() => {
            res.send(fase);
          });
      } else {
        res.send(false);
      }
    });
  });
});

app.listen(port);
