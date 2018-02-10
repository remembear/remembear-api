import { MongoClient, Db } from 'mongodb';
import { URL } from './config';
import { User, Memory, MemoryFilter } from './types';

interface InternalUser extends User {
  password: string,
  created: Date
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

export function findMemory(username: string, filter: MemoryFilter): Promise<Memory> {
  return findOne(username+"_", filter);
}

export function insertMemory(username: string, memory: MemoryFilter) {
  return db.collection(username+"_").insertOne(memory);
}

export function updateMemory(username: string, memory: MemoryFilter, level: number,
    thinkingTime: number, answers: string[], nextUp: Date) {
  return db.collection(username+"_").updateOne(memory, { $set:
    { level: level, thinkingTime: thinkingTime,
        answers: answers, nextUp: nextUp } });
}

export function getTotalPoints(username): Promise<number> {
  let agg = { $group: { _id: null, points: { $sum: "$level" } } };
  return db.collection(username+"_").aggregate([agg]).toArray()
    .then(a => a[0].points)
    .catch(e => 0);
}

export async function findIdsToReview(username, collection: string,
    direction: number): Promise<number[]> {
  let query = {
    nextUp: {$lt: new Date(Date.now())},
    collection: collection,
    direction: direction
  };
  let ids = await db.collection(username+"_").find(query)
    .project({_id:0, wordId:1}).toArray();
  return ids.map(i => i.wordId);
}

export async function findMaxIdInMemory(username, collection: string,
    direction: number): Promise<number> {
  let groups = await db.collection(username+"_").aggregate([
     { $group: { _id: { coll: "$collection", dir: "$direction"}, max: { $max: "$wordId" } } }
  ]).toArray();
  let group = groups.filter(g =>
    g["_id"].coll === collection && g["_id"].dir === direction)[0]
  return group && group.max ? group.max : 0;
}

export async function getMemoryByLevel(username) {
  let levels = [];
  let groups = await db.collection(username+"_").aggregate([
     { $group: { _id: "$level", count: { $sum: 1 } } }
  ]).toArray();
  groups.forEach(g => levels[g["_id"]-1] = g["count"]);
  return levels;
}

export async function findReviewByDirection(username) {
  let groups = await db.collection(username+"_")
    .aggregate([
       { $match: {nextUp: {$lt: new Date(Date.now())} } },
       { $group: { _id: { coll: "$collection", dir: "$direction"}, count: { $sum: 1 } } }
    ]).toArray();
  return groups.map(g => g["count"]);
}

export async function getMemoryByDirection(username) {
  let groups = await db.collection(username+"_").aggregate([
     { $group: { _id: { coll: "$collection", dir: "$direction"}, count: { $sum: 1 } } }
  ]).toArray();
  return groups.map(g => g["count"]);
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
    created: new Date(Date.now())
  }
}

export async function toInt(coll: string, field: string) {
  let recs = await db.collection(coll).find().toArray();
  recs.forEach(x =>
    db.collection(coll).update({_id: x._id}, {$set: {[field]: parseInt(x[field])}}));
}