const express = require('express');
const db = require('./db');

const PORT = process.env.PORT || 8060;

const app = express();
app.use(express.static('data/audio-words/'));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/test', async (req, res) => {
  res.send(await db.getRandomDoc('core10k'));
});

app.get('/login', async (req, res) => {
  res.send(await db.checkLogin(req.query.username, req.query.password));
});

async function init() {
  await db.connect();
  app.listen(PORT, () => {
    console.log('rememberize server live on ' + PORT);
  });
}

init();