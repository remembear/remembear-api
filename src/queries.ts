import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import * as db from './db';
import { Memory, MemoryFilter, MemoryUpdate, DbStudy, DbAnswer } from './db-types';
import { User, Set, Question, Study, UserStatus, Answer, Attempt } from './types';
import { AUDIO_LOCATION, SETS, STUDY_TYPE, VOC_KNA } from './consts';

//words come back after about LEVEL_FACTOR*2^(level-1) days, e.g. 6: [(1),6,12,24,48,..]
const LEVEL_FACTOR = 7;

export async function getUserStatus(username: string, latestPoints?: number): Promise<UserStatus> {
  let status = {
    wordsKnownByLevel: await db.getMemoryByLevel(username),
    wordsKnownByDirection: await db.getMemoryByDirection(username),
    wordsToReviewByDirection: await db.findReviewByDirection(username),
    totalPoints: await db.getTotalPoints(username),
    pointsPerDay: await db.getPointsPerDay(username),
    durationPerDay: await db.getDurationPerDay(username),
    studiesPerDay: await db.getStudiesPerDay(username),
    thinkingPerDay: await db.getThinktimePerDay(username),
    latestPoints: latestPoints ? latestPoints : 0
  }
  return status
}

export async function getNewQuestions(username: string, setIndex: number, direction: number): Promise<Study> {
  let set = SETS[setIndex];
  let known = [];
  try {
    known = await db.findIdsInMemory(username, setIndex, direction)
    known = known.map(k => k.wordId);
  } catch (e) {}
  let dir = set.directions[direction];
  let entries = await db.findTen(set.collection, {
    [set.idField]: {$nin: known, $ne: NaN},
    $where: 'this["'+dir[0]+'"] != this["'+dir[1]+'"]'
  }, SETS[setIndex].idField);
  return toStudy(entries, set, direction, STUDY_TYPE.NEW);
}

export async function getReviewQuestions(username: string, setIndex: number, direction: number): Promise<Study> {
  let set = SETS[setIndex];
  let reviews = [];
  let mems = await db.findIdsToReview(username, setIndex, direction);
  while (mems.length > 0 && reviews.length < 10) {
    reviews.push(mems[_.random(mems.length-1)]);
    _.remove(mems, m => m === _.last(reviews));
  }
  let entries = await Promise.all(reviews.map(r => db.findOne(set.collection, {[set.idField]: r})));
  return toStudy(entries, set, direction, STUDY_TYPE.REVIEW);
}

//returns points made
export async function addResults(username: string, study: Study): Promise<UserStatus> {
  let dbStudy = toDbStudy(study);
  let studyId = await db.insertStudy(username, dbStudy);
  let points = _.sum(await Promise.all(study.answers
      .map(a => updateMemory(username, study, studyId, a))));
  await db.updateStudy(username, dbStudy, points);
  return getUserStatus(username, points);

}

function toDbStudy(study: Study): DbStudy {
  return {
    type: study.type,
    set: study.set,
    direction: study.direction,
    startTime: new Date(study.startTime),
    endTime: new Date(study.endTime),
    points: 0 //placeholder
  }
}

async function updateMemory(username: string, study: Study, studyId: ObjectID, answer: Answer): Promise<number> {
  let filter = { set: study.set, wordId: answer.wordId, direction: study.direction };
  let mem = await db.findMemory(username, filter);
  if (mem) {
    let newLevel = answer.attempts.length === 1 ? mem.level+1 : 1;
    let dbAnswer = {studyId: studyId, attempts: answer.attempts};
    let memoryUpdate = {
      level: newLevel,
      answers: mem.answers.concat(dbAnswer),
      nextUp: calculateNextUp(newLevel)
    }
    db.updateMemory(username, filter, memoryUpdate);
    return newLevel-mem.level;
  }
  let memory = toNewMemory(filter, studyId, answer.attempts);
  db.insertMemory(username, memory);
  return memory.level;
}

async function toStudy(entries: {}[], set: Set, direction: number, type: STUDY_TYPE): Promise<Study> {
  let dir = set.directions[direction];
  let altAnswers;
  if (SETS.indexOf(set) == 1 && direction == 2) { //alt answers for audio direction
    altAnswers = await db.find(set.collection,
      {[VOC_KNA]: { $in: entries.map(e => e[VOC_KNA])}},
      { _id: 0, [VOC_KNA]: 1, [dir[1]]: 1 });
    altAnswers.map(a =>
      a[dir[0]] = entries.filter(e => a[VOC_KNA] === e[VOC_KNA])[0][dir[0]]);
  } else {
    altAnswers = await db.find(set.collection,
     {[dir[0]]: { $in: entries.map(e => e[dir[0]])}},
     { _id: 0, [dir[0]]: 1, [dir[1]]: 1 });
  }
  let questions = entries.map(w => toQuestion(w, set, direction, altAnswers));
  return {
    type: type,
    set: SETS.indexOf(set),
    direction: direction,
    startTime: new Date(),
    endTime: new Date(),
    questions: questions,
    answers: []
  }
}

function toQuestion(entry: {}, set: Set, dirIndex: number, altAnswers: {}[]): Question {
  const dir = set.directions[dirIndex];
  const answers = _.flatten(
    altAnswers.filter(a => a[dir[0]] === entry[dir[0]])
    .map(a => toAnswers(a[dir[1]])));
  return {
    wordId: entry[set.idField],
    question: entry[dir[0]],
    answers: answers,
    fullAnswers: entry[dir[1]],
    otherFields: dir[2].map(f => entry[f]),
    info: set.info.map(f => entry[f]),
    audio: set.audio ? toAudioPath(entry[set.audio]) : undefined
  }
}

function toAnswers(entry: string) {
  return entry.replace(/ *\([^)]*\) */g, "") //remove parentheses
    .replace(/ *\[[^\]]*]/g, "") //remove square brackets
    .replace(/;/g, ",") //semicolons to commas
    .split(',') //split alternatives
    .map(e => e.replace(/[\/&-.'* 。　]/g, "")) //remove special chars
    .map(e => _.trim(_.toLower(e))) //lower case and remove whitespace
    .map(e => e.replace(/s$/, '')) //remove trailing -s for plural
    .map(e => e.replace(/th$/, '')) //remove trailing -th
}

function toAudioPath(audio: string) {
  return AUDIO_LOCATION + audio.slice(7, audio.length-1);
}

function toNewMemory(filter: MemoryFilter, studyId: ObjectID, attempts: Attempt[]): Memory {
  let previouslyKnown = attempts.length == 1;
  let newLevel = previouslyKnown ? 5 : 1;
  return {
    set: filter.set,
    direction: filter.direction,
    wordId: filter.wordId,
    answers: [{studyId: studyId, attempts: attempts}],
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
  if (level == 2) return 2;
  return LEVEL_FACTOR * Math.pow(2, level-3);
}