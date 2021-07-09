const express = require("express");
const Datastore = require("nedb");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const path = require("path");

const time = moment()
    .tz("Asia/Kolkata")
    .format("ha DD-MM-YYYY");

const charList = [" ", "=", ".", "?", ";", ":", "@", "/", "_", "-", "+", "(", ")", ",", "!", "\"", "%", "&", "\'"]
const encodingList = ["%20", "%3D", "%2E", "%3F", "%3B", "%3A", "%40", "%2F", "%5F", "%2D", "%2B", "%28", "%29", "%2C", "%21", "%22", "%25", "%26", "%27"]

//setup database.db
const database = new Datastore("database.db");
database.loadDatabase();

//setup variables
const port = process.env.PORT || 80;
const get_key = process.env.GET_KEY || "0";
const save_key = process.env.SAVE_KEY || "0";

function decodeText(text) {
    for (var i = 0; i < encodingList.length; i++) {
        const character = charList[i];
        const encodingValue = encodingList[i];
        text = String(text).split(encodingValue).join(character);
    }
    return String(text);
}

//setup mailing config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "wmail@gmail.com",
        pass: "password"
    }
});

async function sendMail(receiver, data, subject, res) {
    let info = transporter
        .sendMail({
            from: `thought.vedant@gmail.com`, // sender address
            to: receiver, // list of receivers
            subject: subject, // Subject line
            text: "", // plain text body
            html: data // html body
        })
        .then(info => {
            res.status(200).json({ "status": "ok" });
        });
}

//setup the server
const app = express();
app.use(express.static(path.join(__dirname, "static")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.listen(port, () => {
    console.log("server started");
});

app.get("/", (req, res) => {
    res.status(200).render("index.pug", {});
});

app.get("/save/:key/:thought/:activity/:idea", (req, res) => {
    if (req.params.key == save_key) {
        console.log("saving to database");
        const timestamp = new Date();
        const to_save = {
            timestamp: String(timestamp),
            date: moment(timestamp)
                .tz("Asia/Kolkata")
                .format("hh:mm:ss a DD-MM-YYYY"),
            thought: decodeText(req.params.thought),
            activity: decodeText(req.params.activity),
            idea: decodeText(req.params.idea)
        };
        database.insert(to_save);
        res.status(200).json({ "status": "ok" });
    } else {
        res.status(400).json({ "status": "server error" });
    }
});

app.get("/sendmail/:key/:email/:count", (req, res) => {
    if (req.params.key == get_key) {
        const receiver = req.params.email;
        const count = req.params.count;
        console.log(`sending mail to ${receiver}`);
        database
            .find({})
            .sort({ timestamp: -1 })
            .limit(count)
            .exec((err, docs) => {
                console.log(docs);
                var responses = docs;
                var html_body = "";
                responses.forEach(value => {
                    html_body += `
                    <p>
                        <b>Time: ${value.date}</b><br>
                        <b>Thoughts</b>: ${value.thought}<br>
                        <b>Activity</b>: ${value.activity}<br>
                        <b>Idea</b>: ${value.idea}<br><hr>
                    </p>
                `;
                });
                var to_send = `
                <html>
                    <head></head>
                    <body>
                        ${html_body}
                    </body>
                </html>
            `;
                sendMail(
                    receiver,
                    to_send,
                    `Last ${count} entries of Vedant's journal`,
                    res
                );
            });
    } else {
        res.status(400).json({ "status": "server error" });
    }
});
