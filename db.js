const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const URL = require('./config').URL;

const INDEX = "2k1-Kanken Opt Sort";

let db;

exports.connect = function() {
  return MongoClient.connect(URL)
    .then(client => db = client.db('rememberize'));
}

exports.getRandomDoc = function(coll) {
  let c = db.collection(coll);
  return c.count({})
    .then(n => c.findOne({[INDEX]: _.random(n).toString()}));
}

exports.checkLogin = async function(username, password) {
  let users = db.collection('users');
  let user = await users.findOne({username: username});
  if (!user) {
    user = {username: username, password: password, created: Date.now()};
    await users.insert(user);
    return {success: true};
  }
  return {success: password === user.password};
}

exports.insert = function(coll, docs) {
  return db.collection(coll).insertMany(docs).then(r => r.insertedCount);
}