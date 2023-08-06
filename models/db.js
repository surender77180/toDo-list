const mongoose = require("mongoose");

const username = encodeURIComponent("admin");
const password = encodeURIComponent("wMtYlUYupI39irtq");

module.exports.init = async function () {
    await mongoose.connect(
        "mongodb://mongodb+srv://${username}:${password}@cluster0.r91zg.mongodb.net/?retryWrites=true&w=majority"
        );
    console.log('mdb connected...')
}