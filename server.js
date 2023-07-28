const exp = require("constants");
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const app = express();
const port = 4567;

app.set("view engine", "ejs");

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

    static delItem(email, id){
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

            if(!(email in useritems)){
                useritems[email] = "[]";
            }
            console.log(useritems, email);

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
            const showName= user.username.charAt(0).toUpperCase() + user.username.slice(1)
            res.render("index", { logingInUser: showName, items });
        }
        // fs.readFile("./password.json", (err, data) => {
        //   if (err) {
        //     res.send("file not readable...");
        //   } else {
        //     const users = JSON.parse(data);
        //     const user = users[email];
        //     if (!user) {
        //       res.send("User Not Found...");
        //     } else {
        //       res.render("index", { logingInUser: user.username, items: Item.list });
        //     }
        //   }
        // })
    } else {
        res.redirect("login");
    }
});

app.get("/login", (req, res) => {

    if (req.session.isLoggedIn) {
        res.redirect("/");
    } else {
        res.sendFile(path.join(__dirname, "login.html"));
    }
});

app.post("/item", (req, res) => {
    const task = req.body.task;
    const email = req.session.email;
    const item = new Item(task);
    Item.addItem(email, item);
    res.redirect("/");
});

app.get("/checkitem/:id/:isDone", (req, res) => {
    const { params: { id, isDone } } = req;
    const email = req.session.email;
    const item = Item.findItem(email, id);
    console.log(item);
    if (!item) {
        res.sendStatus(404);
    } else {
        item.isDone =! JSON.parse(isDone);
        Item.addItem(email, item);
        res.redirect("/");
    }
});

app.get("/delitem/:id", (req, res) => {
    const { params: { id } } = req;
    const email = req.session.email;
    const item = Item.findItem(email, id);
    if (!item) {
        res.sendStatus(404);
    } else {
        Item.delItem(email, id);
        res.redirect("/");
    }
});

app.listen(port);

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

    // fs.readFile("./password.json", (err, data) => {
    //   if (err) {
    //     res.send("file not readable...");
    //   } else {
    //     const users = JSON.parse(data);
    //     const user = users[email];
    //     if (!user) {
    //       // res.send("User Not Found...");
    //       res.render("login", { error: "Invalid username..." });

    //     } else if (user.password != password) {
    //       // res.send("wrong pass...");
    //       res.render("login", { error: "Invalid password..." });
    //     } else {
    //       req.session.isLoggedIn = true;
    //       req.session.email = email;
    //       res.redirect("/")
    //     }
    //   }
    // })
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
        res.render("login", {error: "Email already registerd"});
    } else {
        res.render("login", {error: "Registered succesfully..."});
    }

    // fs.readFile("./password.json", (err, data) => {
    //   if (err) {
    //     res.send("file not readable...");
    //   } else {
    //     const users = JSON.parse(data);
    //     if (users[email]) {
    //       res.send("user allready exits...");
    //     } else {
    //       const user = {
    //         username, password, email
    //       };
    //       users[email] = user;
    //       fs.writeFile("./password.json", JSON.stringify(users), err => {
    //         if (err) {
    //           res.send("unable to user...");
    //         } else {
    //           res.send("Registered succesfully...")
    //         }
    //       })
    //     }
    //   }
    // })
})

//add username & logout btn//

// app.get("/getuser", (req, res) => {
//     const email = req.session.email;
//     fs.readFile("./password.json", (err, data) => {
//         if (err) {
//             res.send("file not readable...");
//         } else {
//             const users = JSON.parse(data);
//             const user = users[email];
//             if (!user) {
//                 res.send("User Not Found...");
//             } else {
//                 res.send(user.username);
//             }
//         }
//     })
// })

app.get("/logout", (req, res) => {
    req.session.isLoggedIn = false;
    delete req.session.email;
    res.redirect("/")
})

app.get("/showname/:name", (req, res) => {
    res.send(req.params.name);
})