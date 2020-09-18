const fs = require('fs');
const db = require('../lib/db');
const parse = require('csv-parse/lib/sync');

const KANJI_FILE = 'kanji.csv';
const KANJI_COLL = 'kanji';
const VOCAB_FILE = 'core2k6k10k.csv';
const VOCAB_COLL = 'core10k';

//populate(KANJI_FILE, KANJI_COLL);
//addKanjiOptIndex()
//update2k1KOIndex()

async function populate(file, coll) {
  let words = await csvToJson(file, '@');
  await db.connect();
  let inserted = await db.insert(coll, words);
  console.log(inserted)
}

async function fixKanjiEnglish() {
  const HK = "Heisig Keyword";
  const EM = "English Meaning";
  await db.connect();
  let allKanji = await db.find("kanji", {}, {[HK]: 1, [EM]: 1});
  allKanji.forEach(k => {
    if (k[HK] && k[EM].indexOf(k[HK]) < 0) {
      let combined = k[HK]+', '+k[EM];
      db.update('kanji', {_id: k._id}, {$set: {[EM]: combined}});
      console.log(combined)
    }
  });
}

async function addKanjiOptIndex() {
  const kanji2 = parse(fs.readFileSync('data/kanji2.csv', 'utf8'));
  await db.connect();
  console.log('connected')
  let allKanji = (await db.find("kanji", {}));
  console.log('got kanji')
  await Promise.all(allKanji.map((k,i) => {
    const opt = parseInt(kanji2.filter(l => l[0].includes(k['Kanji']))
      .map(l => l[11])[0]);
    console.log(i, k['Kanji'], opt)
    return db.updateOne('kanji', {_id: k._id}, {$set: {['Opt Index']: opt }});
  }));
  console.log('done: updated', allKanji.length);
}

async function update2k1KOIndex() {
  const kanji2 = parse(fs.readFileSync('data/kanji2.csv', 'utf8'));
  console.log('total', kanji2.length)
  const noId = kanji2.filter(k => !k[9]);
  console.log('no id', noId.length)
  noId.sort((a, b) => a[11] - b[11]);
  await db.connect();
  console.log('connected')
  let allKanji = (await db.find("kanji", {}));
  console.log('got kanji')
  await Promise.all(allKanji.map((k,i) => {
    const index = noId.findIndex(l => l[0].includes(k['Kanji']));
    if (index >= 0) {
      console.log(i, k['Kanji'], index+2002)
      return db.updateOne('kanji', {_id: k._id},
        {$set: {['2k1KO Index']: index+2002 }});
    }
  }));
  console.log('done: updated', allKanji.length);
}

function csvToJson(file, separator) {
  return new Promise((resolve, reject) =>
    fs.readFile(file, 'utf8', (err, data) => {
      let rows = data.split('\n').map(r => r.split(separator));
      let keys = rows[0];
      let words = rows.slice(1).map(r => {
        let obj = {};
        r.forEach((v,i) => obj[keys[i]] = v);
        return obj;
      });
      resolve(words);
    })
  );
}