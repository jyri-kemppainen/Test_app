import  { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
const saltRounds = 10;
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

const sendQuery = async (query) => {
    let res
    try {
        const result = await query
        res = await result.toArray()
    } catch (err) {
		res = err
        throw err
    } finally {
        if (dbServer)
            dbServer.close()
        return(res)
    }
}

const getAllPlaces = async () => {
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
    ]))
}

const getAllUsers = async () => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    return sendQuery(
        usersCol.aggregate([{
            $project: {
                ID: { $toString: "$_id" },
                Name: "$Name",
                Password: "$Password"
            }},{
            $project: {
                "_id": 0
            }}
        ])
    )
}

const getUserByName = async (Name) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    return ( sendQuery(
        usersCol.aggregate([{
            $match: {
                Name: Name
            }},{
            $project: {
                ID: { $toString: "$_id" },
                Name: "$Name",
                Password: "$Password"
            }},{
            $project: {
                "_id": 0
            }}
        ])
    ))
}

const addOneUser = async (Name, Password) => {
    const db = await createDbConn()
    Password = await bcrypt.hash(Password, saltRounds);
    const usersCol = db.collection(userCollection)
    const result = await usersCol.insertOne({ "Name": Name, "Password": Password })

    if( result.acknowledged )
        return ({
            "insertId": result.insertedId.toString(),
            "affectedRows": 1
        })
    return result
}
// return sendQuery( `INSERT INTO Users (Name, Password) VALUES (?, ?)`, true, Name, Password)


const editUserName = async (Name, newName) => {
    const db = await createDbConn()
    const usersCol = db.collection(userCollection)
    const result = await usersCol.updateOne({Name: Name}, { $set: { Name: newName} })
    if( result.acknowledged ) 
        return ({
            "affectedRows": 1
        })
    return result    
}

// return sendQuery( `UPDATE Users SET Name = ? WHERE Name = ?`, true, newName, Name)

const addPlace = async (Name, userID, Latitude, Longitude) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)

    const result = await placesCol.insertOne({Name: Name, UserID: new ObjectId(userID), Latitude: Latitude, Longitude: Longitude })
    if( result.acknowledged )
        return ({
            "insertId": result.insertedId.toString(),
            "affectedRows": 1
        })
    return result
}
//     sendQuery(`INSERT INTO Places (Name, UserID, Latitude, Longitude) VALUES (?, ?, ?, ?)`, true, name, userId, lat, lon);

const deletePlace = async (id, userId) => {
    const db = await createDbConn()
    const placesCol = db.collection(placesCollection)
    const result = await placesCol.deleteOne({_id: new ObjectId(id), UserID: new ObjectId(userId)})
    if( result.acknowledged ) 
        return ({
            "affectedRows": result.deletedCount
        })
    return result
}
//    sendQuery(`DELETE FROM Places WHERE ID = ? AND UserID = ?`, true, id, userId)

export default {
    addOneUser,
    getAllUsers,
    editUserName,
    getAllPlaces,
    getUserByName,
    addPlace,
    deletePlace
}