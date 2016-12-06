import express from 'express';
import bodyParser from 'body-parser';
import admin from "firebase-admin";

const app = express();

// TODO: Enter the path to your service account json file
// Need help with this step go here: https://firebase.google.com/docs/admin/setup
const serviceAccount = require("path/to/serviceAccountKey.json");

// TODO: Enter your database url from firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<DATABASE_NAME>.firebaseio.com"
});

// Setup
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/dist'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get('/', (req, res) => res.send('Madden Data'));
app.post('/*', (req, res) => {
  const db = admin.database();
  const ref = db.ref();
  const dataRef= ref.child("data");

  dataRef.set({
    body: req.body || ''
  });

  res.send('Got a POST request');
});

app.listen(app.get('port'), () => { console.log('Madden Companion Exporter is running on port', app.get('port')) });
