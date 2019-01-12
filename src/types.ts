export interface Set {
  name: string,
  collection: string,
  idField: string,
  directions: Direction[],
  info: string[], //fields to show during question
  audio?: string
}

export interface Direction {
  name: string,
  question: string,
  answer: string,
  extras: string[],
  numOptions?: number
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
  pointsPerDay: number[],
  durationPerDay: number[],
  studiesPerDay: number[],
  newPerDay: number[],
  thinkingPerDay: number[],
  latestPoints: number
}

export interface Study {
  type: string,
  set: number,
  direction: number,
  startTime: Date,
  endTime: Date,
  questions: Question[],
  answers: Answer[]
}

export interface Question {
  wordId: number,
  question: string,
  answers: string[],
  fullAnswers: string,
  otherFields: string[],
  info: string[],
  options?: string[],
  audio?: string
}

export interface Answer {
  wordId: number,
  attempts: Attempt[]
}

export interface Attempt {
  answer: string,
  duration: number
}

export interface Edit {
  set: number,
  direction: number,
  wordId: number,
  answer: string
}