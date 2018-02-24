const fs = require('fs');
const db = require('../lib/db');

const KANJI_FILE = 'kanji.csv';
const KANJI_COLL = 'kanji';
const VOCAB_FILE = 'core2k6k10k.csv';
const VOCAB_COLL = 'core10k';

//populate(KANJI_FILE, KANJI_COLL);

async function populate(file, coll) {
  let words = await csvToJson(file);
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

function csvToJson(file) {
  return new Promise((resolve, reject) =>
    fs.readFile(file, 'utf8', (err, data) => {
      let rows = data.split('\n').map(r => r.split('@'));
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