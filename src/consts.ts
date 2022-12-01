import { Set } from './types';

export const AUDIO_LOCATION = "https://remembear2.onrender.com/"//'http://localhost:8060/';

export enum STUDY_TYPE {
  NEW = "new",
  REVIEW = "review"
}

export const KAN_KAN = "Kanji";
export const KAN_ENG = "English Meaning";

export const VOC_JAP = "Vocab-japan";
export const VOC_KNA = "Vocab-kana";
export const VOC_ENG = "Vocab-translation";
export const VOC_AUD = "Vocab-audio";

export const SEN_JAP = "Sentence-japanese";
export const SEN_ENG = "Sentence-translation";
export const SEN_FUR = "Sentence-Furigana";
export const SEN_AUD = "Sentence-audio";


export const SETS: Set[] = [{
  name: "Kanji",
  collection: "kanji",
  idField: "2k1KO Index",
  directions: [
    {
      name: "Reading", question: KAN_KAN, answer: KAN_ENG,
      extras: ["stroke count", "Kana", "Primitive look-up data."]
    },
    {
      name: "Writing", numOptions: 25, question: KAN_ENG, answer: KAN_KAN,
      extras: ["stroke count", "Kana", "Primitive look-up data."]
    }
  ],
  info: []
}, {
  name: "Vocab",
  collection: "core10k",
  idField: "2k1-Kanken Opt Sort",
  directions: [
    { name: "Writing", question: VOC_ENG, answer: VOC_JAP, extras: [VOC_KNA] },
    { name: "Reading", question: VOC_JAP, answer: VOC_KNA, extras: [VOC_ENG] },
    { name: "Listening", question: VOC_AUD, answer: VOC_ENG, extras: [VOC_JAP] }
  ],
  info: ["Part of speech", "Word-type", "Vocab-RTK"],
  audio: VOC_AUD
}]/*, {
  name: "Sentences",
  collection: "core10k",
  idField: "2k1-Kanken Opt Sort",
  directions: [
    {
      name: "Listening", numOptions: 10, question: SEN_AUD, answer: SEN_JAP,
      extras: [SEN_ENG]
    },
    {
      name: "Reading", numOptions: 10, question: SEN_JAP, answer: SEN_ENG,
      extras: [SEN_JAP]
    },
    {
      name: "Writing", numOptions: 10, question: SEN_ENG, answer: SEN_JAP,
      extras: []
    }
  ],
  info: [],
  audio: SEN_AUD
}];*/