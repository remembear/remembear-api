import * as _ from 'lodash';
import * as db from './db';
import { Similars } from './db-types';

const KANJI = "Kanji";
const RADICALS = "Japan Primitive Look-up"//"Primitive look-up data.";
const STROKES = "stroke count";
const KANJI_SIMS = "kanji_sims";

const NUM_SIMILARS = 50;

export async function createSimilarKanjiCollection() {
  let allKanji = await getAllKanjiWithRadicals();
  console.log("all kanji found")
  let similars = allKanji.map(k => getSimilarKanji(k, allKanji, NUM_SIMILARS));
  console.log("sims calculated")
  await db.insert(KANJI_SIMS, similars);
  console.log("done!")
}

export async function findSimilarKanjis(kanjis: string[]): Promise<Similars[]> {
  let similars = await db.find(KANJI_SIMS, {original: {$in: kanjis}}, {_id: 0, original: 1, similars: 1});
  const found = similars.map(s => s.original);
  await Promise.all(kanjis.map(async k => {
    if (found.indexOf(k) == -1) {
      similars.push({
        original: k,
        similars: (await db.findRandom("kanji", NUM_SIMILARS)).map(k => k[KANJI])
      });
    }
  }));
  return similars;
}

export async function testSimilarKanji(kanji: string) {
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

function getSimilarKanji(kanji, allKanji: any[], count: number): Similars {
  allKanji = allKanji.filter(k => k.k !== kanji.k);
  allKanji.forEach(k => k.v = getKanjiSimilarity(k, kanji));
  allKanji.sort((a,b) => b.v - a.v);
  let similars = allKanji.slice(0, count);
  return {
    originalId: kanji.i,
    original: kanji.k,
    similars: similars.map(k => k.k),
    degrees: similars.map(k => k.v)
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