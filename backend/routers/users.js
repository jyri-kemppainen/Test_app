import express from 'express';
const router = express.Router();
import db from "../mongodb.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const handleError = (err, response) => {
    response.status(404).json(err);
};

// not used in web app
router.get("/", (request, response) => {
    db.getAllUsers(
        (err) => {
            handleError(err, response);
        },
        (users) => {
            response.json(users);
        }
    );
});

// not used in web app
router.get("/:id", (request, response) => {
    const id = request.params.id;
    db.getUser(
        id,
        (err) => {
            handleError(err, response);
        },
        (user) => {
            response.json(user);
        }
    );
});

router.post("/", async (request, response) => {
    request.body.password = await bcrypt.hash(request.body.password, 10);

    db.addUser(
        request.body,
        (err) => {
            handleError(err, response);
        },
        (status) => {
            db.getUser(
                status.insertId,
                (err) => {
                    handleError(err, response);
                },
                (resultArray) => {
                    console.log(resultArray)
                    const token = jwt.sign(
                        {
                            username: resultArray[0]["Name"],
                            id: resultArray[0]["ID"],
                        },
                        process.env.SECRET
                    );
                    delete resultArray[0]["Password"];
                    resultArray[0]["Token"] = token;
                    response.json(resultArray[0]);
                }
            );
        }
    );
});

export default router;
