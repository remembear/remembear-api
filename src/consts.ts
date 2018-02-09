import { Set } from './types';

export const AUDIO_LOCATION = 'http://localhost:8060/';

export const KAN_KAN = "Kanji";
export const KAN_ENG = "English Meaning";

export const VOC_JAP = "Vocab-japan";
export const VOC_KNA = "Vocab-kana";
export const VOC_ENG = "Vocab-translation";
export const VOC_AUD = "Vocab-audio";

export const KANJI: Set = {
  collection: "kanji",
  indexField: "2k1KO Index",
  directions: [
    [KAN_KAN, KAN_ENG, []],
    [KAN_ENG, KAN_KAN, []]
  ],
  info: []
}

export const VOCAB: Set = {
  collection: "core10k",
  indexField: "2k1-Kanken Opt Sort",
  directions: [
    [VOC_ENG, VOC_JAP, [VOC_KNA]],
    [VOC_JAP, VOC_KNA, [VOC_ENG]],
    [VOC_AUD, VOC_ENG, [VOC_JAP]]
  ],
  info: ["Part of speech", "Word-type", "Vocab-RTK"],
  audio: VOC_AUD
}