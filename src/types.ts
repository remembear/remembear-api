export type Id = number;

export interface Set {
  name: string,
  collection: string,
  idField: string,
  directionNames: string[],
  directions: [string, string, string[]][], //question, answer, fields to show after
  info: string[], //fields to show during question
  audio?: string
}

export interface User {
  username: string,
  dailyGoal?: number,
  streak?: number
}

export interface UserStatus {
  wordsKnownByLevel: number[], //sum by levels
  wordsKnownByDirection: number[][], //sum by direction
  wordsToReviewByDirection: number[][],
  totalPoints: number,
  latestPoints: number
}

export interface Study {
  collection: string,
  direction: number,
  startTime: Date,
  endTime: Date,
  questions: Question[],
  answers: Answer[]
}

export interface MemoryFilter {
  collection: string,
  wordId: number,
  direction: number
}

//in user collection
export interface Memory {
  collection: string,
  wordId: number,
  direction: number,
  previouslyKnown: boolean,
  thinkingTime: number,
  answers: string[],
  level: number,
  nextUp: Date
}

export interface Question {
  collection: string,
  wordId: number,
  question: string,
  answers: string[],
  fullAnswers: string,
  otherFields: string[],
  info: string,
  audio?: string
}

export interface Answer {
  wordId: number,
  attempts: string[],
  duration: number
}