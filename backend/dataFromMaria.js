const maria = require("mariadb/callback")
// for MariaDB server
const hostName1="maria.westeurope.cloudapp.azure.com"
const dbUser1="testi"
const dbPassword1="mariadb1"
const dbName1 = "testi1"
// For local MariaDB
const hostName2="localhost"
const dbUser2="jyri"
const dbPassword2="Salasana1"
const dbName2 = "testi"

const copyDataFromMariaToLocal = () => {
    const con1 = maria.createConnection({
        host: hostName1,
        user: dbUser1,
        password: dbPassword1,
        database: dbName1,
    })

    const con2 = maria.createConnection({
        host: hostName2,
        user: dbUser2,
        password: dbPassword2,
        database: dbName2,
    })

    con1.connect(function(err) {
        if (err) throw err;
        console.log("Connected!")
    })

   con1.connect(function(err) {
        if (err) throw err;
        console.log("Connected to Maria!")
    })

    con2.connect(function(err) {
        if (err) throw err;
        console.log("Connected to localdb!")
        con2.query('DELETE FROM Places', function (err, res) {
           if (err) throw err;
           con2.query('DELETE FROM Users', function (err, res) {
              if (err) throw err;
              con1.query(`SELECT ID, Name, Password FROM Users`, function (err, users) {
                 if (err) throw err;
                 users.map(u => {
                    con2.query(`INSERT INTO Users (ID, Name, Password) VALUES (${u.ID}, '${u.Name}', '${u.Password}')`, function (err, users) {
                       if (err) throw err;
                    })
                 })
              })

              con1.query(`SELECT ID, Name, UserID, Latitude, Longitude FROM Places`, function (err, places) {
                 if (err) throw err;
                 places.map(p => {
                    con2.query(`INSERT INTO Places (ID, Name, UserID, Latitude, Longitude)
                                           VALUES (${p.ID}, "${p.Name}", ${p.UserID}, ${p.Latitude}, ${p.Longitude})`, function(err, res) {
                       if (err) throw err;
                    })
                 })
              })
          })
       })
   })
}

copyDataFromMariaToLocal()