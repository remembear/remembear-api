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
  pointsByDay: number[],
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