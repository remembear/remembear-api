import * as _ from 'lodash';

const words = ['the','and','with','at','to','for','a','up'];
const endings = ['th','te','ed','ly','ty','al','ing','ment','ness','icity','tion','ous','t','e','s'];

export function createAnswers(entry: string): string[] {
  return entry.replace(/ *\([^)]*\) */g, "") //remove parentheses
    .replace(/ *\[[^\]]*]/g, "") //remove square brackets
    .replace(/;/g, ",") //semicolons to commas
    .split(',') //split alternatives
    .map(a => normalizeAnswer(a))
}

export function normalizeSingleAnswer(answer: string): string {
  answer = answer.replace(/ *\([^)]*\) */g, "") //remove parentheses
  return normalizeAnswer(answer);
}

function normalizeAnswer(answer: string): string {
  answer = _.trim(_.toLower(answer)); //lower case and trim before removing words
  answer = removeIgnoredWords(answer); //replace all ignored words
  answer = answer.replace(/[\/&-.,'* ]/g, ""); //remove eng special chars
  answer = answer.replace(/[。　]/g, ""); //remove jap special chars
  return removeIgnoredEndings(answer); //remove ignored endings
}

export function normalizeSentenceAnswer(answer: string) {
  //polite, verb endings, particles
  answer = answer.replace(/[ですま、くぐぶつむうるぬ。よねか　]/g, "");
  return answer;
}

function removeIgnoredWords(s: string): string {
  words.forEach(w => s = s.replace(new RegExp(' '+w, 'g'), ''));
  words.forEach(w => s = s.replace(new RegExp(w+' ', 'g'), ''));
  return s;
}

function removeIgnoredEndings(s: string): string {
  endings.forEach(w => s = s.replace(new RegExp(w+'$'), ''));
  return s;
}