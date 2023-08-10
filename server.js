const { getUsersCollection, getListCollection } = require("./models/db");
const exp = require("constants");
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const app = express();

const multer = require("multer");
const { render } = require("ejs");

const upload = multer({ dest: "public/" });


const port = 4567;
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
// single can use single file upload
// array can use multiple file upload
app.use(upload.single("pic")); //middle ware
app.use(express.json()); //middle ware//
app.use(express.urlencoded({ extended: true }));


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

    static async findItem(toDoListId, id) {
        const items = await Item.getItems(toDoListId);
        return items[id];
    }
    static async addItem(taskListId, task) {
        try {
            const listDb = await getListCollection();
            await listDb.updateOne({ _id: taskListId }, { $set: { [task.id]: task } });
            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }
    static async delItem(taskListId, taskId) {
        try {
            const listDb = await getListCollection();
            await listDb.updateOne({ _id: taskListId }, { $unset: { [taskId]: "" } });
            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    static async getItems(taskListId) {
        try {
            const listDb = await getListCollection();
            const list = await listDb.findOne({ _id: taskListId });
            return list;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    static genRandomId() {
        return (10000 + Math.floor(Math.random() * 9999)).toString(16);
    }

    constructor(task) {
        this.task = task;
        this.isDone = false;
        this.id = Item.genRandomId();
        this.imgPath = "";
    }
};

// if user exists, return user, else undefined(means user doesnt exists.)
async function getUser(email) {
    try {
        const db = await getUsersCollection();
        const user = await db.findOne({ email });
        return user;

    } catch (err) {
        console.log("some error occured:", err);
        return null;
    }
}

// if user saved succesfully, then returns true, else false
async function saveUser(user) {
    try {
        const usersDb = await getUsersCollection();
        const result = await usersDb.findOne({ email: user.email });

        if (result) {
            return false;
        } else {
            const listDb = await getListCollection();
            const list = await listDb.insertOne({});
            user.toDoListId = list.insertedId;
            await usersDb.insertOne(user);
        }
        return true;
    } catch (err) {
        console.log("some error occured:", err);
        return false;
    }
}


app.get("/reg", (req, res) => {
    res.render("reg", {});
})


app.get("/", async (req, res) => {

    if (req.session.isLoggedIn) {
        const email = req.session.email;

        const user = await getUser(email);
        if (!user) {
            res.send("User not Found...");
        } else {
            const items = await Item.getItems(user.toDoListId) || { _id: "" };
            delete items["_id"];
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


app.post("/item", async (req, res) => {
    const task = req.body.task;
    // console.log(req.file);
    const email = req.session.email;
    const user = await getUser(email);
    const item = new Item(task);
    item.imgPath = req.file.path;
    await Item.addItem(user.toDoListId, item);
    res.redirect("/");
});


app.get("/checkitem/:id/:isDone", async (req, res) => {
    const { params: { id, isDone } } = req;
    const email = req.session.email;
    const user = await getUser(email);

    const item = await Item.findItem(user.toDoListId, id);
    if (!item) {
        res.sendStatus(404);
    } else {
        item.isDone = !JSON.parse(isDone);
        await Item.addItem(user.toDoListId, item);
        res.redirect("/");
    }
});


app.get("/delitem/:id", async (req, res) => {
    const { params: { id } } = req;
    const email = req.session.email;
    const user = await getUser(email);
    const item = await Item.findItem(user.toDoListId, id);

    if (!item) {
        res.sendStatus(404);
    } else {
        await fs.promises.rm(item.imgPath);
        await Item.delItem(user.toDoListId, id);
        res.redirect("/");
    }
});

// authorise session//
app.post("/login", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const user = await getUser(email);
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
app.post("/adduser", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    const user = {
        username, password, email, toDoListId: null
    };
    const success = await saveUser(user);
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


app.listen(port);