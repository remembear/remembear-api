import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as db from './db';
import * as qrs from './queries';
import { SETS } from './consts';
import * as sim from './similarity';
import * as util from './util';

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

app.get('/delay', async (req, res) => {
  await db.delayMemories(req.query.username);
  res.send();
});

app.get('/expedite', async (req, res) => {
  await db.expediteMemories(req.query.username);
  res.send();
});

app.post('/results', async (req, res) => {
  res.send(await qrs.addResults(req.query.username, req.body));
});

app.post('/edit', async (req, res) => {
  res.send(await db.insertEdit(req.query.username, req.body));
});

async function init() {
  await db.connect();
  app.listen(PORT, () => {
    console.log('remembear server live on ' + PORT);
  });

  //console.log(await qrs.getNewQuestions('test', 1, 1))
  /*console.log(await db.findOne('test_memories', {}))
  await db.delayMemories('test');
  console.log(await db.findOne('test_memories', {}))*/
  //console.log(await db.getMemoryByDirection('furotaru'))
  //console.log(await db.findEdits('test', 0, 0, 9))
  //console.log(await qrs.getUserStatus('test2'))
  //console.log(JSON.stringify(await db.getNewPerDay('furotaru')));
  //console.log(JSON.stringify(await db.getStudiesPerDay('furotaru')));
  //console.log(await util.normalizeSingleAnswer('warm up'))
  //console.log(await util.createAnswers('warm (something) up'))
  //await db.updateMany('furotaru_studies', {}, { $rename: { 'thinktime': 'thinkingTime' } } )
  /*console.log(await db.getThinkingTimePerDay2('metrik'))
  await db.updateAllStudyThinkingTimes('metrik')
  console.log(await db.getThinkingTimePerDay2('metrik'))*/
  //console.log('done')
  /*console.log(new Date(Date.now()))
  await qrs.getUserStatus('furotaru');
  console.log(new Date(Date.now()))*/
  //await db.updateAllStudyThinkingTimes('furotaru');
  //console.log('done');
  /*console.log(await sim.testSimilarKanji('忙'));
  console.log(await sim.testSimilarKanji('悪'));
  console.log(await sim.testSimilarKanji('倍'));
  console.log(await sim.testSimilarKanji('特'));*/
  //await sim.createSimilarKanjiCollection();
  //console.log((await qrs.getReviewQuestions('test', 1, 2)).questions.map(r => r.answers))
  //console.log(await db.findMaxIdInMemory('test', 'core10k', 0));
  //console.log(await db.findReviewByDirection('test'));
  //console.log(await db.getMemoryByDirection('test'));
  //console.log(await db.getDurationByDay('furotaru'));
  //console.log(await db.getStudiesByDay('furotaru'));
  //console.log(await db.getThinkingTimePerDay('test'));
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