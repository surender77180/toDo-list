const {MongoClient}= require("mongodb");
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

async function getUsersCollection(){
    const connection = await client.connect();
    const db = connection.db("summerTraining"); //database nam
    return db.collection("users"); //collection name
}

async function getListCollection(){
    const connection = await client.connect();
    const db = connection.db("summerTraining"); //database nam
    return db.collection("lists"); //collection name
}

module.exports = {
    getUsersCollection,
    getListCollection
};