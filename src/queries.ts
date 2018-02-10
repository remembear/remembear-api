import * as _ from 'lodash';
import { User, Set, Question, Study, Memory, UserStatus } from './types';
import { AUDIO_LOCATION } from './consts';
import * as db from './db';

//words come back after about LEVEL_FACTOR*2^(level-1) days, e.g. 6: [(1),6,12,24,48,..]
const LEVEL_FACTOR = 6;

interface MemoryUpdate {
  collection: string,
  direction: number,
  wordId: number,
  answers: string[],
  duration: number
}

export async function getReviewQuestions(username: string, set: Set, direction: number): Promise<Study> {
  let reviews = [];
  let mems = await db.findIdsToReview(username, set.collection, direction);
  while (mems.length > 0 && reviews.length < 10) {
    reviews.push(mems[_.random(mems.length-1)]);
    _.remove(mems, m => m === _.last(reviews));
  }
  let entries = await Promise.all(reviews.map(r => db.findOne(set.collection, {[set.idField]: r})));
  return toStudy(entries, set, direction);
}

export async function getNewQuestions(username: string, set: Set, direction: number): Promise<Study> {
  let maxId = 0;
  try {
    maxId = await db.findMaxIdInMemory(username, set.collection, direction);
  } catch (e) {}
  let entries = await db.findTen(set.collection, {[set.idField]: {$gt: maxId}});
  //entries = entries.slice(0,1);
  return toStudy(entries, set, direction);
}

//returns points made
export async function addResults(username: string, study: Study): Promise<UserStatus> {
  return Promise.all(study.answers.map(a => updateMemory(username, {
    collection: study.collection,
    direction: study.direction,
    wordId: a.wordId,
    answers: a.attempts,
    duration: a.duration
  })))
  .then(points => getUserStatus(username, _.sum(points)));
}

export async function getUserStatus(username: string, latestPoints?: number): Promise<UserStatus> {
  return {
    wordsKnownByLevel: await db.getMemoryByLevel(username),
    wordsKnownByDirection: await db.getMemoryByDirection(username),
    wordsToReviewByDirection: await db.findReviewByDirection(username),
    totalPoints: await db.getTotalPoints(username),
    latestPoints: latestPoints ? latestPoints : 0
  }
}

async function updateMemory(username: string, update: MemoryUpdate): Promise<number> {
  let filter = { collection: update.collection, wordId: update.wordId,
    direction: update.direction };
  let mem = await db.findMemory(username, filter);
  if (mem) {
    let newLevel = update.answers.length === 1 ? mem.level+1 : 1;
    let newTime = mem.thinkingTime+update.duration;
    let newAnswers = mem.answers.concat(update.answers);
    let nextUp = calculateNextUp(newLevel);
    db.updateMemory(username, filter, newLevel, newTime, newAnswers, nextUp);
    return newLevel-mem.level;
  }
  db.insertMemory(username, toNewMemory(update));
  return 1;
}

function toStudy(entries: {}[], set: Set, direction: number): Study {
  return {
    collection: set.collection,
    direction: direction,
    startTime: new Date(),
    endTime: new Date(),
    questions: entries.map(w => toQuestion(w, set, direction)),
    answers: []
  }
}

function toQuestion(entry: {}, set: Set, dirIndex: number): Question {
  const dir = set.directions[dirIndex];
  return {
    collection: set.collection,
    wordId: entry[set.idField],
    question: entry[dir[0]],
    answers: entry[dir[1]].split(','),
    otherFields: dir[2].map(f => entry[f]),
    info: set.info.map(f => entry[f]).join(',　'),
    audio: set.audio ? toAudioPath(entry[set.audio]) : undefined
  }
}

function toAudioPath(audio: string) {
  return AUDIO_LOCATION + audio.slice(7, audio.length-1);
}

function toNewMemory(update: MemoryUpdate): Memory {
  let previouslyKnown = update.answers.length == 1;
  let newLevel = previouslyKnown ? 4 : 1;
  return {
    collection: update.collection,
    direction: update.direction,
    wordId: update.wordId,
    previouslyKnown: previouslyKnown,
    thinkingTime: update.duration,
    answers: update.answers,
    level: newLevel,
    nextUp: calculateNextUp(newLevel)
  };
}

function calculateNextUp(level: number): Date {
  const min = toDays(level-1);
  const max = toDays(level);
  const days = _.random(min, max, true);
  return new Date(Date.now() + (days*24*60*60*1000));
}

function toDays(level: number) {
  if (level == 0) return 0;
  if (level == 1) return 1;
  return LEVEL_FACTOR * Math.pow(2, level-2);
}