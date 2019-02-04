import * as _ from 'lodash';
import { ObjectID } from 'mongodb';
import * as db from './db';
import { Memory, MemoryFilter, DbStudy } from './db-types';
import { Set, Question, Study, UserStatus, Answer, Attempt } from './types';
import { AUDIO_LOCATION, SETS, STUDY_TYPE, VOC_KNA } from './consts';
import { createAnswers } from './util';
import { findSimilarKanjis } from './similarity';
//levels/avgdays: 1:.5, 2:1.5, 3:4.5, 4:10.5, 5:21, 6:42, 7:84, 8:168, 9:336
//current levels/days: 1:0-1, 2:1-2, 3:2-7, 4:7-14, 5:14-28, 6:28-56, 7:56-108, 8:108-216, 9:216-432
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
    newPerDay: await db.getNewPerDay(username),
    thinkingPerDay: await db.getThinkingTimePerDay(username),
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
    $where: 'this["'+dir.question+'"] != this["'+dir.answer+'"]'
  }, SETS[setIndex].idField);
  return toStudy(username, entries, set, direction, STUDY_TYPE.NEW);
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
  return toStudy(username, entries, set, direction, STUDY_TYPE.REVIEW);
}

//returns points made
export async function addResults(username: string, study: Study): Promise<UserStatus> {
  let dbStudy = toDbStudy(study);
  let studyId = await db.insertStudy(username, dbStudy);
  let points = _.sum(await Promise.all(study.answers
      .map(a => updateMemory(username, study, studyId, a))));
  let thinkingTime = _.sum(_.flatten(study.answers.map(a => a.attempts.map(t => t.duration))));
  await db.updateStudyPoints(username, studyId, points);
  await db.updateStudyThinkingTime(username, studyId, thinkingTime);
  return getUserStatus(username, points);
}

function toDbStudy(study: Study): DbStudy {
  return {
    type: study.type,
    set: study.set,
    direction: study.direction,
    startTime: new Date(study.startTime),
    endTime: new Date(study.endTime),
    points: 0, //placeholder
    thinkingTime: 0 //placeholder
  }
}

async function updateMemory(username: string, study: Study, studyId: ObjectID, answer: Answer): Promise<number> {
  let filter = { set: study.set, wordId: answer.wordId, direction: study.direction };
  let mem = await db.findMemory(username, filter);
  if (mem) {
    let newLevel = answer.attempts.length === 1 ? mem.level+1 : Math.max(mem.level-2, 1);
    let dbAnswer = {studyId: studyId, attempts: answer.attempts, newLevel: newLevel};
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

async function toStudy(username: string, entries: {}[], set: Set, dirIndex: number, type: STUDY_TYPE): Promise<Study> {
  const altAnswers = await getAltAnswers(entries, set, dirIndex);
  const edits = await getEdits(username, entries, set, dirIndex);
  const questions = await Promise.all(entries.map((e,i) => toQuestion(e, set, dirIndex, altAnswers, edits[i])));
  const numOptions = set.directions[dirIndex].numOptions;
  if (numOptions) {
    let options = await findSimilarKanjis(questions.map(q => q.answers[0]));
    options.forEach(o => o.similars = o.similars.slice(0, numOptions-1));//_.sampleSize(o.similars, numOptions));
    questions.forEach(q => {
      let opts = options.filter(o => o.original === q.answers[0])[0]
      opts = opts ? opts : options[0]; //in case no similars are found...
      q.options = _.shuffle([q.answers[0]].concat(opts.similars));
    });
  }
  return {
    type: type,
    set: SETS.indexOf(set),
    direction: dirIndex,
    startTime: new Date(),
    endTime: new Date(),
    questions: questions,
    answers: []
  }
}

async function getAltAnswers(entries: {}[], set: Set, dirIndex: number) {
  let dir = set.directions[dirIndex];
  if (SETS.indexOf(set) == 1 && dirIndex == 2) { //alt answers for audio direction
    let altAnswers = await db.find(set.collection,
      {[VOC_KNA]: { $in: entries.map(e => _.trim(e[VOC_KNA]))}},
      { _id: 0, [VOC_KNA]: 1, [dir.answer]: 1 });
    altAnswers.forEach(a =>
      a[dir.question] = entries.filter(e => a[VOC_KNA] === e[VOC_KNA]).map(e => e[dir.question]));
    return altAnswers;
  }
  let qs = entries.map(e => e[dir.question]);
  let as = entries.map(e => e[dir.answer]);
  let altAnswers = await db.find(set.collection,
    {[dir.question]: { $in: qs}},
    { _id: 0, [dir.question]: 1, [dir.answer]: 1 });
  return altAnswers.filter(a => as.indexOf(a[dir.answer]) < 0);
}

function getEdits(username: string, entries: {}[], set: Set, dirIndex: number) {
  return Promise.all(entries.map(e =>
    db.findEdits(username, SETS.indexOf(set), dirIndex, e[set.idField])));
}

function toQuestion(entry: {}, set: Set, dirIndex: number, altAnswers: {}[], edits: string[]): Question {
  const dir = set.directions[dirIndex];
  let answers = _.flatten([entry].concat(
    altAnswers.filter(a => a[dir.question] === entry[dir.question]
      || (a[dir.question].length && a[dir.question].indexOf(entry[dir.question]) >= 0)))
    .map(a => a[dir.answer])
    .concat(edits)
    .map(a => createAnswers(a)));
  return {
    wordId: entry[set.idField],
    question: entry[dir.question],
    options: dir.numOptions ? [] : undefined,
    answers: answers,
    fullAnswers: entry[dir.answer],
    otherFields: dir.extras.map(f => entry[f]),
    info: set.info.map(f => entry[f]),
    audio: set.audio ? toAudioPath(entry[set.audio]) : undefined
  }
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
    answers: [{studyId: studyId, attempts: attempts, newLevel: newLevel}],
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