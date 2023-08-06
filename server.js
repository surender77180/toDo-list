const exp = require("constants");
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const app = express();

const multer = require("multer");
const { render } = require("ejs");
const { mongo } = require("mongoose");
const upload = multer({ dest: "public/" });

// const {MongoClient} = require("mongodb"); 

const port = 4567;
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
// single can use single file upload
// array can use multiple file upload
app.use(upload.single("pic")); //middle ware
app.use(express.json()); //middle ware//
app.use(express.urlencoded({ extended: true }));

// async function main(){
//     const uri = "mongodb+srv://admin:python@<your-cluster-url>/test?retryWrites=true&w=majority";
    
//     const client = new MongoClient(uri);
//     try{
//         await client.connect();
//         await listDatabases(client);
//     }catch(err){
//         console.log(err);
//     }finally{
//         await client.close();
//     }
// }
// main().catch(console.error);

app.use(session({
    secret: "i love this my village..",
    resave: true,
    saveUninitialized: true,
    // cookie: {secure: true}
}))


function serverFile(url, filename) {  //
    app.get(url, (req, res) => {
        res.sendFile(__dirname + "/" + filename);
    })
}


serverFile("/style.css", "style.css");
serverFile("/logreg.css", "logreg.css")
serverFile("/index.js", "index.js");


class Item {
    static list = {};

    static findItem(email, id) {
        const items = Item.getItems(email);
        return items[id];
    }
    static addItem(email, item) {
        try {
            const data = fs.readFileSync("data.json");
            const useritems = JSON.parse(data);
            if (!(email in useritems)) {
                useritems[email] = "{}";
            }
            const items = JSON.parse(useritems[email]);
            items[item.id] = item;
            useritems[email] = JSON.stringify(items);
            fs.writeFileSync("data.json", JSON.stringify(useritems));
            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    static delItem(email, id) {
        try {
            const data = fs.readFileSync("data.json");
            const useritems = JSON.parse(data);
            if (!(email in useritems)) {
                useritems[email] = "{}";
            }
            const items = JSON.parse(useritems[email]);
            delete items[id];
            useritems[email] = JSON.stringify(items);
            fs.writeFileSync("data.json", JSON.stringify(useritems));
            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    static genRandomId() {
        return (10000 + Math.floor(Math.random() * 9999)).toString(16);
    }
    static getItems(email) {
        try {
            const data = fs.readFileSync("data.json");
            const useritems = JSON.parse(data);

            if (!(email in useritems)) {
                useritems[email] = "[]";
            }
            // console.log(useritems, email);
            return JSON.parse(useritems[email]);

        } catch (err) {
            console.log(err);
            return null;
        }
    }

    constructor(task) {
        this.task = task;
        this.isDone = false;
        this.id = Item.genRandomId();
        this.imgPath = "";
    }
};

// if user exists, return user, else undefined(means user doesnt exists.)
function getUser(email) {
    try {
        const data = fs.readFileSync("./password.json");
        const users = JSON.parse(data);
        const user = users[email];
        return user;
    } catch (err) {
        console.log("some error occured:", err);
        return null;
    }
}

// if user saved succesfully, then returns true, else false
function saveUser(user) {
    try {
        const data = fs.readFileSync("./password.json");
        const users = JSON.parse(data);

        if (user.email in users) {
            return false;
        } else {
            users[user.email] = user;
        }
        fs.writeFileSync("./password.json", JSON.stringify(users));
        return true;
    } catch (err) {
        console.log("some error occured:", err);
        return false;
    }
}


app.get("/reg", (req, res) => {
    res.render("reg", {});
})


app.get("/", (req, res) => {

    if (req.session.isLoggedIn) {
        // console.log(req.session.username);
        // res.sendFile(path.join(__dirname, "index.html"));
        const email = req.session.email;

        const user = getUser(email);
        if (!user) {
            res.send("User not Found...");
        } else {
            const items = Item.getItems(email);
            const showName = user.username.charAt(0).toUpperCase() + user.username.slice(1)
            res.render("index", { logingInUser: showName, items });
        }
    } else {
        res.redirect("login");
    }
});


app.get("/login", (req, res) => {
    res.render("login", { error: "" });
});


app.post("/item", (req, res) => {
    const task = req.body.task;
    console.log(req.file);
    const email = req.session.email;
    const item = new Item(task);
    item.imgPath = req.file.path;
    Item.addItem(email, item);
    res.redirect("/");
});


app.get("/checkitem/:id/:isDone", (req, res) => {
    const { params: { id, isDone } } = req;
    const email = req.session.email;
    const item = Item.findItem(email, id);
    if (!item) {
        res.sendStatus(404);
    } else {
        item.isDone = !JSON.parse(isDone);
        Item.addItem(email, item);
        res.redirect("/");
    }
});


app.get("/delitem/:id", (req, res) => {
    const { params: { id } } = req;
    const email = req.session.email;
    item.imgPath = req.file.path;
    const item = Item.findItem(email, id);
    if (!item) {
        res.sendStatus(404);
    } else {
        Item.delItem(email, id);
        res.redirect("/");
    }
});

// authorise session//
app.post("/login", function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const user = getUser(email);
    if (!user) {
        res.render("login", { error: "Invalid username..." });
    } else if (password != user.password) {
        res.render("login", { error: "Invalid password..." });
    } else {
        req.session.isLoggedIn = true;
        req.session.email = email;
        res.redirect("/")
    }
});

//register new user//
app.post("/adduser", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    const user = {
        username, password, email
    };
    const success = saveUser(user);
    if (!success) {
        res.render("login", { error: "Email already registerd" });
    } else {
        res.render("login", { error: "Registered succesfully..." });
    }
})

//add username & logout btn//
app.get("/logout", (req, res) => {
    req.session.isLoggedIn = false;
    delete req.session.email;
    res.redirect("/")
})

app.get("/showname/:name", (req, res) => {
    res.send(req.params.name);
})


// db.init().then(function () {
    app.listen(port);
// })