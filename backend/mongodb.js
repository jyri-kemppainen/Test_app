import { MongoClient, ObjectId } from 'mongodb';
const dbHost = "localhost:27017"
const dbName = "placesDb"
const placesCollection = "Places"
const usersCollection = "Users"
const dbUser = "testi"
const dbPassword = "Salasana1"
const dbConnString = `mongodb://${dbUser}:${dbPassword}@${dbHost}`
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

export default {
    addUser,
    getAllUsers,
    getAllPlaces,
    getUserByName,
    getUser,
    addPlace,
    getPlace,
    deletePlace
}