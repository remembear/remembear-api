import * as _ from 'lodash';
import { MongoClient, Db } from 'mongodb';
import { URL } from './config';

const INDEX = "2k1-Kanken Opt Sort";

let db: Db;

export function connect() {
  return MongoClient.connect(URL)
    .then(client => db = client.db('rememberize'));
}

export function getRandomDoc(coll) {
  let c = db.collection(coll);
  return c.count({})
    .then(n => c.findOne({[INDEX]: _.random(n).toString()}));
}

export async function checkLogin(username, password) {
  let users = db.collection('users');
  let user = await users.findOne({username: username});
  if (!user) {
    user = {username: username, password: password, created: Date.now()};
    await users.insert(user);
    return {success: true};
  }
  return {success: password === user.password};
}

export function insert(coll, docs) {
  return db.collection(coll).insertMany(docs).then(r => r.insertedCount);
}