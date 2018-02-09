export type Id = number;
export type Datetime = number;

export interface Set {
  collection: string,
  indexField: string,
  directions: [string, string, string[]][], //question, answer, fields to show after
  info: string[], //fields to show during question
  audio?: string
}

export enum Directions {
  kanjiJapEng, kanjiEngJap,
  wordsEngJap, wordsJapHir, wordsAudEng,
  sentsAudJap, sentsAudEng
}

export interface User {
  username: string,
  wordsKnownByLevel: number[], //sum by levels
  wordsKnownBySet: number[], //sum by levels
  dailyGoal?: number,
  streak?: number
}

export interface Study {
  username: string,
  direction: Directions,
  points: number,
  startTime: Datetime,
  endTime: Datetime,
  questions: Answer[]
}

export interface Answer {
  question: number, //word/kanji id
  answer: string,
  attempts: number,
  startTime: Datetime,
  endTime: Datetime
}

//in user collection
export interface Memory {
  word: Id,
  levels: number[], //by direction
  nextUp: Datetime[] //by direction
}

export interface Question {
  question: string,
  answers: string[],
  otherFields: string[],
  info: string,
  audio?: string
}

export interface Word {
  japanese: string,
  kana: string,
  translation: string,
  info: string,
  audio: string
}