import { MongoClient, ObjectId } from 'mongodb';
// import { hash } from 'bcrypt';
// const saltRounds = 10;
const dbHost = "localhost:27017"
const dbName = "placesDb"
const placesCollection = "Places"
const userCollection = "Users"
const dbUser = "testi"
const dbPassword = "Salasana1"
const dbConnString = `mongodb://${dbUser}:${dbPassword}@${dbHost}`
const dbServer = new MongoClient(dbConnString)

const createDbConn = async () => {
    await dbServer.connect()
    return dbServer.db(dbName)
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
    } /* finally {
        dbServer.close()
    }*/
}

const getAllPlaces = async (onError, onSuccess) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)
    return sendQuery(placesCol.aggregate([{
        $lookup: {
            from: "Users",
            localField: "UserID",
            foreignField: "_id",
            as: "tulos"
        }},
        { $project: {
            ID: { $toString: "$_id" },
            Name: "$Name",
            UserName: "$tulos.Name",
            Latitude: "$Latitude",
            Longitude: "$Longitude",
            UserID: { $toString: "$UserID" }
        }},
        { $project: {
            "_id": 0,
        }},
        { $unwind : "$UserName" }
    ]), onError, onSuccess, true)
}
// sendQuery(`SELECT Places.*, Users.Name AS UserName FROM Places JOIN Users ON Users.ID = Places.UserID`, onError, onSuccess);

const getAllUsers = async (onError, onSuccess) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    return sendQuery( usersCol.aggregate([{
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
// sendQuery(`SELECT * FROM Users`, onError, onSuccess);

const addUser = async ({ name, password }, onError, onSuccess) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    //    Password = await hash(Password, saltRounds);
    return sendQuery( usersCol.insertOne({
        Name: name,
        Password: password
    }), onError, onSuccess)
}
// sendQuery(`INSERT INTO Users (Name, Password) VALUES ('${name}', '${password}')`, onError, onSuccess, true);

const addPlace = async ({ name, userId, lat, lon }, onError, onSuccess ) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)
    return sendQuery(placesCol.insertOne({
        Name: name,
        UserID: new ObjectId(userId),
        Latitude: lat,
        Longitude: lon
    }), onError, onSuccess)
}
// sendQuery(`INSERT INTO Places (Name, UserID, Latitude, Longitude) VALUES ('${name}',${userId},${lat},${lon})`, onError, onSuccess, true);

const getPlace = async (id, onError, onSuccess) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)
    return sendQuery(placesCol.aggregate([{
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
            UserID: { $toString: "$UserID" }
        }},
        { $project: {
            "_id": 0,
        }},
        { $unwind : "$UserName" }
    ]), onError, onSuccess, true)
};
// sendQuery(`SELECT Places.*, Users.Name AS UserName FROM Places JOIN Users ON Users.ID = Places.UserID WHERE Places.ID =${id}`, onError, onSuccess);

const deletePlace = async (id, onError, onSuccess) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)
    return sendQuery(placesCol.deleteOne({
        _id: new ObjectId(id)
    }), onError, onSuccess) 
}
// sendQuery(`DELETE FROM Places WHERE ID=${id}`, onError, onSuccess, true);

const getUser = async (id, onError, onSuccess) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    return sendQuery( usersCol.aggregate([{
            $match: {
                _id: new ObjectId(id)
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
// sendQuery(`SELECT * FROM Users WHERE ID=${id}`, onError, onSuccess);

const getUserByName = async (name, onError, onSuccess) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    return sendQuery( usersCol.aggregate([{
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