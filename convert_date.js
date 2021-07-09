const moment = require("moment-timezone")
const Datastore = require("nedb");

const database = new Datastore("database.db");
const newdatabase = new Datastore("temp.db");
newdatabase.loadDatabase();
database.loadDatabase();

database.find({}, (err, data) => {
    for(var i = 0;i < data.length;i++){
        const timestamp = String(moment(data[i]["date"], "hh:mm:ss a DD-MM-YYYY").unix());
        const new_data = {
            "timestamp": timestamp,
            "date": data[i]["date"],
            "thought": data[i]["thought"],
            "activity": data[i]["activity"],
            "idea": data[i]["idea"]
        }
        console.log(new_data)
        newdatabase.insert(new_data);
    }
})

// newdatabase.find({}).sort({"timestamp": -1}).limit(5).exec((err, data) => {
//     console.log(data)
// })