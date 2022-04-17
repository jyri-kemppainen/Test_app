import { MongoClient } from 'mongodb'
const dbHost = "mongodb://localhost:27017/"
const dbName = "placesDb"
const placesCollection = "Places"
const usersCollection = "Users"
const dbUser = "testi"
const dbPassword = "Salasana1"

const usersInfo = [
	{ Name: "Radu", Password: "password" },
	{ Name: "Jyri", Password: "1234" },
	{ Name: "Petri", Password: "p3tri" }
]

const createCollections = async () => {
	const dbServer = new MongoClient(dbHost)
	try {
		await dbServer.connect()
		const db = dbServer.db(dbName)
		const dbs = await db.admin().listDatabases()
		if(dbs.databases.find(d => d.name === dbName))
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
		 } )
		 users.createIndex( { "Name" : 1 }, { unique : true } )

		 let result = await users.insertMany(usersInfo)
		 console.log(`${result.insertedCount} users were inserted`);

		 const placesInfo = [
			{ Name: "favorite beach", UserID: (await (users.find({Name: "Radu"}, {projection: {Name: 0, Password: 0}})).toArray())[0]._id, Latitude: 62.6126, Longitude: 29.696 },
			{ Name: "favorite pizza place", UserID: (await (users.find({Name: "Jyri"}, {projection: {Name: 0, Password: 0}})).toArray())[0]._id, Latitude: 62.6009, Longitude: 29.7598 },
			{ Name: "favorite hiking place", UserID: (await (users.find({Name: "Petri"}, {projection: {Name: 0, Password: 0}})).toArray())[0]._id, Latitude: 62.6277, Longitude: 29.8759 },
			{ Name: "favorite swimming pool", UserID: (await (users.find({}, {projection: {Name: 0, Password: 0}}).limit(1)).toArray())[0]._id, Latitude: 62.6031, Longitude: 29.7443 },
			{ Name: "favorite shop", UserID: (await (users.find({}, {projection: {Name: 0, Password: 0}}).limit(1)).toArray())[0]._id, Latitude: 62.6296, Longitude: 29.7064 }
		]

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
		try {
			await db.admin().addUser( dbUser, dbPassword, { roles: [{role: "readWrite", db: dbName }]})
		} catch {
			await db.admin().removeUser(dbUser)
			await db.admin().addUser( dbUser, dbPassword, { roles: [{role: "readWrite", db: dbName }]})
		}
	 } catch (e) {
		console.log(e)
	} finally {
		 await dbServer.close()
	}
}

createCollections()