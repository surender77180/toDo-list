const exp = require("constants");
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 4567;


app.use(express.json()); //middle ware//
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "i love this my village..",
    resave: true,
    saveUninitialized: true,
    // cookie: {secure: true}
}))

function serverFile(url, filename) {
    app.get(url, (req, res) => {
        res.sendFile(__dirname + "/" + filename);
    })
}

serverFile("/style.css", "style.css");
serverFile("/logreg.css", "logreg.css")
serverFile("/index.js", "index.js");
serverFile("/reg", "/reg.html");

class Item {
    static list = {};

    static findItem(fid) {
        return Item.list[fid];
    }
    static addItem(item) {
        Item.list[item.id] = item;
    }
    static genRandomId() {
        return (10000 + Math.floor(Math.random() * 9999)).toString(16);
    }

    constructor(task) {
        this.task = task;
        this.isDone = false;
        this.id = Item.genRandomId();
    }
};

app.get("/", (req, res) => {

    if (req.session.isLoggedIn) {
        // console.log(req.session.username);
        res.sendFile(path.join(__dirname, "index.html"));
    } else {
        res.redirect("login");
    }
});

app.get("/login", (req, res) => {

    if (req.session.isLoggedIn){
        res.redirect("/");
    }else{
        res.sendFile(path.join(__dirname, "login.html"));
    }
});

app.get("/items", (req, res) => {
    const data = JSON.stringify(Item.li);
    res.send(data);
});

app.put("/Item", (req, res) => {
    const { query: { task } } = req;
    const item = new Item(task);
    Item.addItem(item);
    res.send("adding new item");
});

app.post("/item", (req, res) => {
    const { query: { id, isDone } } = req;
    const item = Item.findItem(id);
    if (!item) {
        res.sendStatus(404);
    } else {
        item.isDone = JSON.parse(isDone);
        res.send("success");
    }
});

app.delete("/item", (req, res) => {
    const { query: { id } } = req;
    const item = Item.findItem(id);
    if (!item) {
        res.sendStatus(404);
    } else {
        delete Item.list[id];
        res.send("deleting item");
    }
});

app.listen(port);

// authorise session//
app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    fs.readFile("./password.json", (err, data) => {
        if (err) {
            res.send("file not readable...");
        } else {
            const users = JSON.parse(data);
            const user = users[username];
            if (!user) {
                res.send("User Not Found...");
            } else if (user.password != password) {
                res.send("wrong pass...");
            } else {
                req.session.isLoggedIn = true;
                req.session.username = username;
                res.redirect("/")
            }
        }
    })
});

//register new user//
app.post("/adduser", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const mobileNo = req.body.mobileno;

    fs.readFile("./password.json", (err, data) => {
        if (err) {
            res.send("file not readable...");
        } else {
            const users = JSON.parse(data);
            if (users[username]) {
                res.send("user allready exits...");
            } else {
                const user = {
                    username, password, mobileNo
                };
                users[username] = user;
                fs.writeFile("./password.json", JSON.stringify(users), err => {
                    if (err) {
                        res.send("unable to user...");
                    } else {
                        res.send("registerd succesfully...")
                    }
                })
            }
        }
    })
})

