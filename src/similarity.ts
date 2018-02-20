import * as _ from 'lodash';
import * as db from './db';

const KANJI = "Kanji";
const RADICALS = "Primitive look-up data.";

export async function findSimilar(kanji: string) {
  let allKanji = await db.find("kanji", {});
  allKanji = allKanji.map(k => ({"i": k["_id"], "k": k[KANJI], "r": k[RADICALS]}));
  allKanji = allKanji.filter(k => k.r !== undefined);
  allKanji.forEach(k => k.r = k.r.split(',').filter(e => e !== ''));
  allKanji = allKanji.filter(k => k.r.length > 0);
  let queryKanji = allKanji.filter(k => k.k === kanji)[0];
  console.log(queryKanji);

  allKanji = allKanji.filter(k => k.k !== kanji);
  allKanji.forEach(k => k.v = getSimilarity(k.r, queryKanji.r));
  allKanji.sort((a,b) => b.v - a.v)
  console.log(allKanji.slice(0,10))//.map(k => k.k));
}

function getSimilarity(a1: any[], a2: any[]) {
  return intersect(a1, a2).length / Math.pow(1+Math.abs(a1.length-a2.length), 0.5);
}

function intersect(a1: any[], a2: any[]) {
  return a1.filter(x => a2.indexOf(x) >= 0);
}