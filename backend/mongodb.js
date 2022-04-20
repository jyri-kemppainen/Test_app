const { MongoClient, ObjectId } = require('mongodb')
const dbName = "placesDb"
const placesCollection = "Places"
const usersCollection = "Users"
const dbUser = "testi"
const dbPassword = "Salasana1"
// MongoDB-local
const dbHost = "localhost:27017"
const dbConnString = `mongodb://${dbUser}:${dbPassword}@${dbHost}`
// MongoDB-Atlas
//const dbAtlasHost = `cluster0.ahrwa.mongodb.net/`
//const dbConnString = `mongodb+srv://${dbUser}:${dbPassword}@${dbAtlasHost}`
const dbServer = new MongoClient(dbConnString)


const createDbConn = async (collection) => {
    await dbServer.connect()
    const db = dbServer.db(dbName)
    return db.collection(collection)
}

const sendQuery = async (query, onError, onSuccess, toArray = false) => {
    let res
    try {
        const result = await query
        if(toArray)
            res = await result.toArray()
        else
            if(result.insertedId)
                res = {
                    "insertId": result.insertedId.toString(),
                }
            else
                res = {
                    "deletedCount": result.deletedCount.toString(),
                }              
        onSuccess(res)
    } catch (err) {
        onError(err)
    } 
}

const getAllPlaces = async (onError, onSuccess) => {
    const placesCol = await createDbConn(placesCollection)
    return sendQuery(placesCol.aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "tulos"
        }},{
        $project: {
            ID: { $toString: "$_id" },
            Name: "$Name",
            UserName: "$tulos.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: { $toString: "$UserID" },
            "_id": 0
        }},{
        $unwind : "$UserName"
        }
    ]), onError, onSuccess, true)
}
// sendQuery(`SELECT Places.*, Users.Name AS UserName FROM Places JOIN Users ON Users.ID = Places.UserID`, onError, onSuccess);

const getNearbyPlaces = async (onError, onSuccess, lat, lon, dist) => {
    const placesCol = await createDbConn(placesCollection)
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)
    const distNum = parseFloat(dist)
    return sendQuery(placesCol.aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "tulos"
        }},{
        $project: {
            ID: { $toString: "$_id" },
            Name: "$Name",
            UserName: "$tulos.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: { $toString: "$UserID" },
             "_id": 0
        }},{
        $addFields : {
            distance: {
                $multiply: [
                    { $acos:
                        { $add: [
                            { $multiply: [
                                { $sin: {$degreesToRadians: latNum}},
                                { $sin: {$degreesToRadians: "$Latitude"}}
                            ]},
                            {$multiply:[
                                { $cos: {$degreesToRadians: latNum}},
                                { $cos: {$degreesToRadians: "$Latitude"}},
                                { $cos: {$degreesToRadians: {$subtract: [lonNum, "$Longitude"]}}}
                            ]}
                        ]}
                    },
                    6371
                ]}
        }},{
        $match: {
            distance: {"$lt": distNum} 
        }},{
        $unwind : "$UserName"
        }
    ]), onError, onSuccess, true)
}
// `SELECT Places.*, Users.Name AS UserName, 
//      (SELECT acos(sin(radians(${lat}))*sin(radians(Latitude))+
//         cos(radians(${lat}))*cos(radians(Latitude))*cos(radians(${lon}-Longitude)))*
//         6371) AS distance
//  FROM Places JOIN Users ON Users.ID = Places.UserID
//  HAVING distance < ${dist}`


const getPlacesWithinBounds = async (onError, onSuccess, north, south, east, west) => {
    const placesCol = await createDbConn(placesCollection)
    const northNum = parseFloat(north)
    const southNum = parseFloat(south)
    const eastNum = parseFloat(east)
    const westNum = parseFloat(west)
    return sendQuery(placesCol.aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "tulos"
        }},{
        $project: {
            ID: { $toString: "$_id" },
            Name: "$Name",
            UserName: "$tulos.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: { $toString: "$UserID" },
            "_id": 0
        }},{
        $match: {
            Latitude: {"$gte": southNum, "$lte": northNum},
            Longitude: {"$gte": westNum, "$lte": eastNum} 
        }},{
        $unwind : "$UserName"
        }
    ]), onError, onSuccess, true)
};
/*
    `SELECT Places.*, Users.Name AS UserName 
        FROM Places JOIN Users
        ON Users.ID = Places.UserID
        WHERE Latitude BETWEEN ${south} AND ${north} AND
        Longitude BETWEEN ${west} AND ${east}
        ORDER BY RAND() LIMIT 100`,
        onError,
        onSuccess
    );
*/
const getAllUsers = async (onError, onSuccess) => {
    return sendQuery((await createDbConn(usersCollection)).aggregate([{
            $project: {
                ID: { $toString: "$_id" },
                Name: "$Name",
                Password: "$Password",
                "_id": 0                
            }}
    ]), onError, onSuccess, true)
}
// sendQuery(`SELECT * FROM Users`, onError, onSuccess);

const addUser = async ({ name, password }, onError, onSuccess) => {
    return sendQuery((await createDbConn(usersCollection)).insertOne({
        Name: name,
        Password: password
    }), onError, onSuccess)
}
// sendQuery(`INSERT INTO Users (Name, Password) VALUES ('${name}', '${password}')`, onError, onSuccess, true);

const addPlace = async ({ name, userId, lat, lon }, onError, onSuccess ) => {
    return sendQuery((await createDbConn(placesCollection)).insertOne({
        Name: name,
        UserID: new ObjectId(userId),
        Latitude: lat,
        Longitude: lon
    }), onError, onSuccess)
}
// sendQuery(`INSERT INTO Places (Name, UserID, Latitude, Longitude) VALUES ('${name}',${userId},${lat},${lon})`, onError, onSuccess, true);

const getPlace = async (id, onError, onSuccess) => {
    return sendQuery((await createDbConn(placesCollection)).aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "result"
        }},{
        $match: {
            _id: new ObjectId(id)
        }},{        
        $project: {
            ID: { $toString: "$_id" },
            Name: "$Name",
            UserName: "$result.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: { $toString: "$UserID" },
            "_id": 0
        }},{
        $unwind : "$UserName" }
    ]), onError, onSuccess, true)
};
// sendQuery(`SELECT Places.*, Users.Name AS UserName FROM Places JOIN Users ON Users.ID = Places.UserID WHERE Places.ID =${id}`, onError, onSuccess);

const deletePlace = async (id, onError, onSuccess) => {
    return sendQuery((await createDbConn(placesCollection)).deleteOne({
        _id: new ObjectId(id)
    }), onError, onSuccess) 
}
// sendQuery(`DELETE FROM Places WHERE ID=${id}`, onError, onSuccess, true);

const getUser = async (id, onError, onSuccess) => {
    return sendQuery((await createDbConn(usersCollection)).aggregate([{
            $match: {
                _id: new ObjectId(id)
            }},{
            $project: {
                ID: { $toString: "$_id" },
                Name: "$Name",
                Password: "$Password",
                "_id": 0             
            }}
        ]), onError, onSuccess, true)
}
// sendQuery(`SELECT * FROM Users WHERE ID=${id}`, onError, onSuccess);

const getUserByName = async (name, onError, onSuccess) => {
    return sendQuery((await createDbConn(usersCollection)).aggregate([{
            $match: {
                Name: name
            }},{
            $project: {
                ID: { $toString: "$_id" },
                Name: "$Name",
                Password: "$Password"
            }},{
            $project: {
                "_id": 0
            }}
        ]), onError, onSuccess, true)
}
//sendQuery(`SELECT * FROM Users WHERE Name='${name}'`, onError, onSuccess);

module.exports = {
    addUser,
    getAllUsers,
    getAllPlaces,
    getUserByName,
    getUser,
    addPlace,
    getPlace,
    deletePlace,
    getNearbyPlaces,
    getPlacesWithinBounds
}