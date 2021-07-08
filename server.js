const express = require("express");
const Datastore = require("nedb");
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
const path = require("path");

const time = moment().tz("Asia/Kolkata").format("ha DD-MM-YYYY")

//setup database.db
const database = new Datastore('database.db');
database.loadDatabase();

//setup variables
const port = process.env.PORT || 80;
const get_key = process.env.GET_KEY || "0";
const save_key = process.env.SAVE_KEY || "0";

//setup mailing config
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
        user: "email@gmail.com",
        pass: "password",
    },
});

async function sendMail(receiver, data, subject, res){
    let info = transporter.sendMail({
        from: `thought.vedant@gmail.com`, // sender address
        to: receiver, // list of receivers
        subject: subject, // Subject line
        text: "", // plain text body
        html: data, // html body
    }).then(info => {
        res.status(200).send(info);
    });
}

//setup the server
const app = express();
app.use(express.static(path.join(__dirname, 'static')));
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

app.listen(port, () => {console.log("server started")});

app.get("/", (req,res)=>{
    res.status(200).render("index.pug", {})
})

app.get("/save/:key/:thought/:activity/:idea", (req,res) => {
    if(req.params.key == save_key){
        const to_save = {
            "timestamp": moment(new Date()).tz("Asia/Kolkata").format("h:m:s a DD-MM-YYYY"),
            "thought": req.params.thought,
            "activity": req.params.activity,
            "idea": req.params.idea
        }
        database.insert(to_save);
        res.status(200).send("ok");
    }else{res.status(400).send("server error")}
})

app.get("/sendmail/:key/:email/:count", (req,res) => {
    if(req.params.key == get_key){
        const receiver = req.params.email;
        const count = req.params.count;
        console.log(`sending mail to ${receiver}`)
        database.find({}).sort({"timestamp": -1}).limit(count).exec((err, docs) => {
            console.log(docs)
            docs.reverse()
            var responses = docs;
            var html_body = "";
            responses.forEach(value => {
                html_body += `
                    <p>
                        Time: ${value.timestamp}<br>
                        Thoughts: ${value.thought}<br>
                        Activity: ${value.activity}<br>
                        Idea: ${value.idea}<br><hr>
                    </p>
                `;
            })
            const to_send = `
                <html>
                    <head></head>
                    <body>
                        ${html_body}
                    </body>
                </html>
            `;
            sendMail(receiver, to_send, `Last ${count} entries of Vedant's journal`, res);
        })
    }else{
        res.status(400).send("server error");
    }
})
