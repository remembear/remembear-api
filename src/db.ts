import { MongoClient, Db, ObjectID } from 'mongodb';
import { URL } from './config';
import { DbUser, Memory, MemoryFilter, MemoryUpdate,　DbStudy, DbAnswer } from './db-types';
import { SETS } from './consts';

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

export function findTen(collection: string, query?: {}, sortField?: string) {
  let sort = sortField ? {[sortField]: 1} : {};
  return db.collection(collection).find(query).sort(sort).limit(10).toArray();
}

export function find(collection: string, query?: {}, projection?: {}) {
  return db.collection(collection).find(query).project(projection).toArray();
}

export function update(coll: string, filter: {}, update: {}) {
  db.collection(coll).update(filter, update);
}

export function insertStudy(username: string, study: DbStudy): Promise<ObjectID> {
  return db.collection(username+"_studies").insertOne(study).then(o => o.insertedId);
}

export function updateStudy(username: string, study: DbStudy, points: number) {
  return db.collection(username+"_studies").updateOne(study, { $set: {points: points} });
}

export function findMemory(username: string, filter: MemoryFilter): Promise<Memory> {
  return findOne(username+"_memories", filter);
}

export function insertMemory(username: string, memory: MemoryFilter) {
  return db.collection(username+"_memories").insertOne(memory);
}

export function updateMemory(username: string, memory: MemoryFilter, update: MemoryUpdate) {
  return db.collection(username+"_memories").updateOne(memory, { $set: update });
}

export async function getStudiesPerDay(username): Promise<number[]> {
  let agg = [
    { $group: {
      _id: { year: {$year: "$endTime"}, month: {$month: "$endTime"}, day: {$dayOfMonth :"$endTime"} },
      count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  let results = await db.collection(username+"_studies").aggregate(agg).toArray();
  return results.map(r => r.count);
}

export async function getDurationPerDay(username): Promise<number[]> {
  let agg = [
    { $group: {
      _id: { year: {$year: "$endTime"}, month: {$month: "$endTime"}, day: {$dayOfMonth :"$endTime"} },
      duration: { $sum: { $subtract: [ "$endTime", "$startTime" ] } } } },
    { $sort: { _id: 1 } }
  ];
  let results = await db.collection(username+"_studies").aggregate(agg).toArray();
  return results.map(r => r.duration / 1000 / 60);
}

export async function getThinktimePerDay(username: string): Promise<number[]> {
  let agg = [
    { $lookup: {
        from: username+"_memories",
        localField: "_id",
        foreignField: "answers.studyId",
        as: "answers"
    } },
    { $unwind: "$answers" },
    { $project: { "endTime": 1 ,
      duration: { $arrayElemAt: [ { $arrayElemAt: [ "$answers.answers.attempts.duration", 0 ] }, 0] }
    } },
    { $group: {
      _id: { year: {$year: "$endTime"}, month: {$month: "$endTime"}, day: {$dayOfMonth :"$endTime"} },
      duration: { $sum: "$duration" }
    } },
    { $sort: { _id: 1 } }
  ];
  let results = await db.collection(username+"_studies").aggregate(agg).toArray();
  //console.log(JSON.stringify(results[0], null, 2))
  return results.map(r => r.duration / 1000 / 60);
}

export async function getPointsPerDay(username): Promise<number[]> {
  let agg = [
    { $group: {
      _id: { year: {$year: "$endTime"}, month: {$month: "$endTime"}, day: {$dayOfMonth :"$endTime"} },
      points: { $sum: "$points" } } },
    { $sort: { _id: 1 } }
  ];
  let results = await db.collection(username+"_studies").aggregate(agg).toArray();
  return results.map(r => r.points);
}

export function getTotalPoints(username): Promise<number> {
  let agg = { $group: { _id: null, points: { $sum: "$level" } } };
  return db.collection(username+"_memories").aggregate([agg]).toArray()
    .then(a => a[0].points)
    .catch(e => 0);
}

export async function findIdsToReview(username, set: number, direction: number): Promise<number[]> {
  let query = {
    nextUp: {$lt: new Date(Date.now())},
    set: set,
    direction: direction
  };
  let ids = await db.collection(username+"_memories").find(query)
    .project({_id:0, wordId:1}).toArray();
  return ids.map(i => i.wordId);
}

export async function findMaxIdInMemory(username, set: number,
    direction: number): Promise<number> {
  let groups = await db.collection(username+"_memories").aggregate([
     { $group: { _id: { set: "$set", dir: "$direction"}, max: { $max: "$wordId" } } }
  ]).toArray();
  let group = groups.filter(g =>
    g["_id"].set === set && g["_id"].dir === direction)[0]
  return group && group.max ? group.max : 0;
}

export async function findIdsInMemory(username: string, set: number, direction: number): Promise<number[]> {
  return await db.collection(username+"_memories")
    .find({ set: set, direction: direction })
    .project({ _id: 0, wordId: 1 }).toArray();
}

export async function getMemoryByLevel(username) {
  let levels = [];
  let groups = await db.collection(username+"_memories").aggregate([
     { $group: { _id: "$level", count: { $sum: 1 } } }
  ]).toArray();
  groups.forEach(g => levels[g["_id"]-1] = g["count"]);
  return levels;
}

export async function findReviewByDirection(username) {
  let groups = await db.collection(username+"_memories").aggregate([
    { $match: { nextUp: {$lt: new Date(Date.now())} } },
    { $group: { _id: { set: "$set", dir: "$direction"}, count: { $sum: 1 } } }
  ]).toArray();
  return mapToSets(groups);
}

export async function getMemoryByDirection(username) {
  let groups = await db.collection(username+"_memories").aggregate([
    { $group: { _id: { set: "$set", dir: "$direction"}, count: { $sum: 1 } } }
  ]).toArray();
  return mapToSets(groups);
}

function mapToSets(groupedResults: {count: number}[]) {
  return SETS.map((s,j) => s.directions.map((d,i) => {
    let group = groupedResults.filter(g => g["_id"].set === j && g["_id"].dir === i);
    return group.length > 0 ? group[0].count : 0
  }));
}

export async function checkLogin(username, password): Promise<{}> {
  let users = db.collection('users');
  let user: DbUser = await users.findOne({username: username});
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

function createUser(username: string, password: string): DbUser {
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