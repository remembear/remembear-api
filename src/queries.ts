import * as _ from 'lodash';
import { User, Set, Question } from './types';
import { AUDIO_LOCATION } from './consts';
import * as db from './db';

interface UserStatus extends User {
  wordsToReview: number
}

/*export function getUserStatus(username: string): Promise<UserStatus> {
  db.collection('users');
}*/

export async function getRandomQuestion(set: Set) {
  let n = await db.getNumberOfDocs(set.collection);
  return db.findOne(set.collection, {[set.indexField]: _.random(n).toString()});
}

/*export function getReviewWords(username: string): Promise<Word[]> {

}*/

export async function getNewQuestions(username: string, set: Set, dir: number): Promise<Question[]> {
  const entries = await db.findTen(set.collection);
  return entries.map(w => toQuestion(w, set, dir));
}

function toQuestion(entry: {}, set: Set, dirIndex: number): Question {
  const dir = set.directions[dirIndex];
  return {
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