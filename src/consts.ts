import { Set } from './types';

export const AUDIO_LOCATION = "https://remembear-api.herokuapp.com/"//'http://localhost:8060/';

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
  directionNames: [
    "Reading",
    "Writing"
  ],
  directions: [
    [KAN_KAN, KAN_ENG, ["stroke count", "Kana", "Primitive look-up data."]],
    [KAN_ENG, KAN_KAN, ["stroke count", "Kana", "Primitive look-up data."]]
  ],
  info: []
}, {
  name: "Vocab",
  collection: "core10k",
  idField: "2k1-Kanken Opt Sort",
  directionNames: [
    "Writing",
    "Reading",
    "Listening"
  ],
  directions: [
    [VOC_ENG, VOC_JAP, [VOC_KNA]],
    [VOC_JAP, VOC_KNA, [VOC_ENG]],
    [VOC_AUD, VOC_ENG, [VOC_JAP]]
  ],
  info: ["Part of speech", "Word-type", "Vocab-RTK"],
  audio: VOC_AUD
}, {
  name: "Sentences",
  collection: "core10k",
  idField: "2k1-Kanken Opt Sort",
  directionNames: [
    "Listening",
    "Reading"
  ],
  directions: [
    [SEN_AUD, SEN_JAP, [SEN_ENG]],
    [SEN_JAP, SEN_ENG, [SEN_JAP]]
  ],
  info: [],
  audio: SEN_AUD
}];