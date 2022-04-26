// for MariaDB
const maria = require("mariadb/callback")
const hostName="maria.westeurope.cloudapp.azure.com"
const dbUser1="testi"
const dbPassword1="mariadb1"
const dbName1 = "testi1"
// MongoDB
const { MongoClient } = require('mongodb')
const dbHost = `mongodb://localhost:27017/`
const dbName2 = "placesDb"
const placesCollection = "Places"
const usersCollection = "Users"
const dbUser2 = "testi"
const dbPassword2 = "Salasana1"
// MongoDB-Atlas
const dbUser3 = "atlasUser"
const dbPassword3 = "atlasPassword"
const dbAtlasHost = `cluster0.ahrwa.mongodb.net/`
const dbAtlasConnString = `mongodb+srv://${dbUser3}:${dbPassword3}@${dbAtlasHost}`

const copyDataFromMariaToMongo = () => {
    const con = maria.createConnection({
        host: hostName,
        user: dbUser1,
        password: dbPassword1,
        database: dbName1,
    })
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!")
    })

	con.query(`SELECT Name, Password FROM Users`, function (err, users) {
		if (err) throw err;    
        con.query(`SELECT Places.*, Users.Name AS UserName FROM Places JOIN Users
                    ON Users.ID = Places.UserID`, (err, places) => {
            if (err) throw err
            createCollections(users, places)
            con.close()
        })
    })
}

const createCollections = async (usersData, placesData) => {
	// Change the commented line if Atlas is used
	const dbServer = new MongoClient(dbHost)
//	const dbServer = new MongoClient(dbAtlasConnString)

	try {
		await dbServer.connect()
		const db = dbServer.db(dbName2)
		const dbs = await db.admin().listDatabases()
		if(dbs.databases.find(d => d.name === dbName2))
			db.dropDatabase()

		const users = db.collection( usersCollection, {
			validator: { $jsonSchema: {
			   bsonType: "object",
			   required: [ "Name", "Password" ],
			   properties: {
				  Name: {
					 bsonType: "string",
					 description: "must be a string and is required"
				  },
				  Password: {
					 bsonType : "string",
					 description: "must be a string and is required"
				  }
			   }
			} }
		})
		users.createIndex( { "Name" : 1 }, { unique : true } )

		let result = await users.insertMany(usersData)
		console.log(`${result.insertedCount} users were inserted`);

        const placesInfo = await Promise.all(placesData.map(async (p) => {
			p.UserID = (await users.find({Name: p.UserName}, {projection: {Name: 0, Password: 0}}).toArray())[0]._id
			delete p.UserName
			return p
		}))
 
		const places = db.collection( placesCollection, {
			validator: { $jsonSchema: {
			   bsonType: "object",
			   required: [ "Name", "UserID", "Latitude" ,"Longitude" ],
			   properties: {
				  Name: {
					 bsonType: "string",
					 description: "must be a string and is required"
				  },
				  UserID: {
					 bsonType : "object",
					 description: "must match with one of the Users collections User's _id object"
				  },
				  Latitude: {
					bsonType : "double",
					minimum : -90,
					maximum: 90,
					description: "must be a decimal number between -90 and 90"
				  },
				  Longitude: {
					bsonType : "double",
					minimum : -180,
					maximum: 180,
					description: "must be a decimal number between -180 and 180"
			 	  }
		   		}
			} }
	 	} )

		result = await places.insertMany(placesInfo)
		console.log(`${result.insertedCount} places were inserted`);

		// add user authorization for dbName
		// Note! comment the code from this point if Atlas is used
		try {
			await db.admin().addUser( dbUser2, dbPassword2, { roles: [{role: "readWrite", db: dbName2 }]})
		} catch {
			await db.admin().removeUser(dbUser2)
			await db.admin().addUser( dbUser2, dbPassword2, { roles: [{role: "readWrite", db: dbName2 }]})
		}
		//Note! comment up to this point if Atlas is used

	 } catch (e) {
		console.log(e)
	} finally {
		 await dbServer.close()
	}
}

copyDataFromMariaToMongo()