import { ObjectID } from 'mongodb';
import { User, Attempt } from './types';

export interface DbUser extends User {
  password: string,
  created: Date
}

export interface DbStudy {
  type: string,
  set: number,
  direction: number,
  startTime: Date,
  endTime: Date,
  points: number
}

export interface MemoryFilter {
  set: number,
  direction: number,
  wordId: number
}

export interface MemoryUpdate {
  level: number,
  answers: DbAnswer[],
  nextUp: Date
}

//in user collection
export interface Memory {
  set: number,
  wordId: number,
  direction: number,
  answers: DbAnswer[],
  level: number,
  nextUp: Date
}

export interface DbAnswer {
  studyId: ObjectID,
  attempts: Attempt[]
}