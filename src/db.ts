import { MongoClient, Db } from 'mongodb';
import { URL } from './config';
import { User, Datetime } from './types';

interface InternalUser extends User {
  password: string,
  created: Datetime
}

let db: Db;

export function connect() {
  return MongoClient.connect(URL)
    .then(client => db = client.db('rememberize'));
}

export function getNumberOfDocs(collection): Promise<number> {
  return db.collection(collection).count({});
}

export function findOne(collection: string, filter: {}) {
  return db.collection(collection).findOne(filter);
}

export function findTen(collection: string, query?: {}) {
  return db.collection(collection).find(query).limit(10).toArray();
}

export async function checkLogin(username, password): Promise<{}> {
  let users = db.collection('users');
  let user: InternalUser = await users.findOne({username: username});
  if (!user) {
    user = createUser(username, password);
    await users.insert(user);
    return {success: true};
  }
  return {success: password === user.password};
}

export function insert(coll, docs) {
  return db.collection(coll).insertMany(docs).then(r => r.insertedCount);
}

function createUser(username: string, password: string): InternalUser {
  return {
    username: username,
    password: password,
    created: Date.now(),
    wordsKnownByLevel: [],
    wordsKnownBySet: []
  }
}