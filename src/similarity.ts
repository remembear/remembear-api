import * as _ from 'lodash';
import * as db from './db';

const KANJI = "Kanji";
const RADICALS = "Primitive look-up data.";
const STROKES = "stroke count";

export async function updateAllSimilarKanji() {
  let allKanji = await getAllKanjiWithRadicals();
  console.log("all kanji found")
  let similars = allKanji.map(k => getSimilarKanji(k, allKanji, 50));
  console.log("sims calculated")
  await db.insert("kanji_sims", similars);
  console.log("done!")
}

export async function findSimilarKanji(kanji: string) {
  let allKanji = await getAllKanjiWithRadicals();
  let queryKanji = allKanji.filter(k => k.k === kanji)[0];
  return getSimilarKanji(queryKanji, allKanji, 10);
}

async function getAllKanjiWithRadicals() {
  let allKanji = await db.find("kanji", {});
  allKanji = allKanji.map(k => ({"i": k["_id"], "k": k[KANJI], "r": k[RADICALS], "s": k[STROKES]}));
  allKanji = allKanji.filter(k => k.r !== undefined);
  allKanji.forEach(k => k.r = k.r.split(',').filter(e => e !== ''));
  return allKanji.filter(k => k.r.length > 0);
}

function getSimilarKanji(kanji, allKanji: any[], count: number) {
  allKanji = allKanji.filter(k => k.k !== kanji.k);
  allKanji.forEach(k => k.v = getKanjiSimilarity(k, kanji));
  allKanji.sort((a,b) => b.v - a.v);
  let similars = allKanji.slice(0, count);
  return {
    "original_id": kanji.i,
    "original": kanji.k,
    "similars": similars.map(k => k.k),
    "degrees": similars.map(k => k.v)
  };
}

function getKanjiSimilarity(k1, k2) {
  return getArraySim(k1.r, k2.r) / getNumSim(k1.s, k2.s);
}

function getArraySim(a1: any[], a2: any[]) {
  return intersect(a1, a2).length / getNumSim(a1.length, a2.length);
}

function getNumSim(n1: number, n2: number) {
  let mean = (n1+n2)/2;
  return Math.pow(1+(Math.abs(n1-n2)/mean), 1);
}

function intersect(a1: any[], a2: any[]) {
  return a1.filter(x => a2.indexOf(x) >= 0);
}