var express = require('express');
var bodyParser = require('body-parser');
var admin = require("firebase-admin");

const app = express();

const serviceAccount = require("./cfmexport-firebase-adminsdk-hye9t-13c1204d5c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cfmexport.firebaseio.com"
});

// Setup
// Change the default port here if you want for local dev.
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/dist'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get('/', function(req, res) {
  return res.send('Madden Data')
});

// This accepts all posts requests!
app.post('/*', function(req, res) {
  const db = admin.database();
  const ref = db.ref();
  const dataRef= ref.child("data");
  // Change what is set to the database here
  // Rosters are in the body under rosterInfoList
  const newDataRef = dataRef.push();
  newDataRef.set({
    data: (req && req.body) || ''
  });

  res.send('Got a POST request');
});

app.listen(app.get('port'), function() { console.log('Madden Companion Exporter is running on port', app.get('port')) });
