import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as db from './db';
import * as qrs from './queries';
import { SETS } from './consts';

const PORT = process.env.PORT || 8060;

const app = express();
app.use(bodyParser.json());
app.use(express.static('data/audio-words/'));
app.use(express.static('data/audio-sentences/'));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/login', async (req, res) => {
  res.send(await db.checkLogin(req.query.username, req.query.password));
});

app.get('/test', async (req, res) => {
  res.send(await qrs.getUserStatus('test'));
});

app.get('/status', async (req, res) => {
  res.send(await qrs.getUserStatus(req.query.username));
});

app.get('/new', async (req, res) => {
  res.send(await qrs.getNewQuestions(req.query.username,
    parseInt(req.query.setIndex), parseInt(req.query.dirIndex)));
});

app.get('/review', async (req, res) => {
  res.send(await qrs.getReviewQuestions(req.query.username,
    parseInt(req.query.setIndex), parseInt(req.query.dirIndex)));
});

app.post('/results', async (req, res) => {
  res.send(await qrs.addResults(req.query.username, req.body));
});

async function init() {
  await db.connect();
  app.listen(PORT, () => {
    console.log('remembear server live on ' + PORT);
  });
  //console.log(await db.findMaxIdInMemory('test', 'core10k', 0));
  //console.log(await db.findReviewByDirection('test'));
  //console.log(await db.getMemoryByDirection('test'));
  //await qrs.getNewQuestions('test', 1, 1);
  //console.log(await db.findAlternativeAnswers(SETS[0].collection, SETS[0].directions[1][0], SETS[0].directions[1][1]));
  //console.log(await db.findAlternativeAnswers(SETS[1].collection, SETS[1].directions[1][0], SETS[1].directions[1][1]));
  /*console.log(JSON.stringify(await Promise.all(SETS.map((s,i) =>
    s.directions.map(async (d,j) => {
      let ans = await db.findAlternativeAnswers(s.collection, d[0], d[1])
      console.log(ans.length)
      return ans.length
    })
  ))));*/
  /*console.log(await db.toInt("kanji", "stroke count"));
  console.log(await db.toInt('kanji', "Heisig RTK Index"));
  console.log(await db.toInt('kanji', "RTK2 Index"));
  console.log(await db.toInt('kanji', "2k1KO Index"));
  console.log(await db.toInt('kanji', "Kanji Learner Course Index"));
  console.log(await db.toInt('kanji', "Freq."));
  console.log(await db.toInt('kanji', "Number (KANJIDIC)"));
  console.log(await db.toInt('kanji', "KanKen (Jun1=1.5) (Jun2=2.5)"));*/
}

init();