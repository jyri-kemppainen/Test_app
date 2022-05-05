// MongoDB
const { MongoClient } = require('mongodb')
const dbName = "placesDb"
const placesCollection = "Places"
const usersCollection = "Users"
const dbUser = "testi"
const dbPassword = "Salasana1"
const dbHost = `localhost:27017`
const dbConnectionString = `mongodb://${dbUser}:${dbPassword}@${dbHost}`
// MongoDB-Atlas
/*
const dbUser3 = "atlasUser"
const dbPassword3 = "atlasPassword"
const dbAtlasHost = `cluster0.ahrwa.mongodb.net/`
const dbAtlasConnString = `mongodb+srv://${dbUser3}:${dbPassword3}@${dbAtlasHost}`
*/

const dbServer = new MongoClient(dbConnectionString)

const createDbConn = async (collection) => {
    await dbServer.connect()
    const db = dbServer.db(dbName)
    return db.collection(collection)
}

const sendQuery = async (query, onError, onSuccess, toArray = false) => {
    let res
    try {
        const result = await query
        if( toArray )
            res = await result.toArray()
        else
            res = result
        onSuccess(res)
    } catch (err) {
        onError(err)
    }
}

const getAllUsers = async (onError, onSuccess) => {
    return sendQuery((await createDbConn(usersCollection)).aggregate([{
            $project: {
                ID: {$toString: "$_id"},
                Name: "$Name",
                Password: "$Password",
                "_id": 0
            }
        }]), onError, onSuccess, true)
}

// sendQuery(`SELECT * FROM Users`, onError, onSuccess);

const getPlacesWithinBounds = async (onError, onSuccess, north, south, east, west) => {
    const northNum = parseFloat(north)
    const southNum = parseFloat(south)
    const eastNum = parseFloat(east)
    const westNum = parseFloat(west)
    sendQuery((await createDbConn(placesCollection)).aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "result"
        }},{
        $project: {
            ID: {$toString: "$_id"},
            Name: "$Name",
            UserName: "$result.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: {toString:"$UserID"},
            "_id": 0
        }},/*{
        $match: {
            Latitude: {"$gte": southNum, "$lte": northNum},
            Longitude: {"$gte": westNum, "$lte": eastNum} 
        }},{
        $sample: {
            size: 100
        }},{    
        $unwind : "$UserName"
        }
*/    ]), onError, onSuccess, true)
}

/*`SELECT Places.*, Users.Name AS UserName 
FROM Places JOIN Users
ON Users.ID = Places.UserID
WHERE Latitude BETWEEN ${south} AND ${north} AND
Longitude BETWEEN ${west} AND ${east}
ORDER BY RAND() LIMIT 100`,
*/

module.exports = {
    getAllUsers,
    getPlacesWithinBounds
};