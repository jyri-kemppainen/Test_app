import 'dotenv/config'
import express from "express";
import cors from "cors";

const server = express();
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
const swaggerDocument = YAML.load('./openapidoc.yaml');

server.use(express.static('../frontend/build')) // react client starts from host url
server.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
server.use(cors()); // middleware
server.use(express.json()); // middleware

import placesRouter from "./routers/places.js";
server.use("/api/places", placesRouter);

import userRouter from "./routers/users.js";
server.use("/api/users", userRouter);

import loginRouter from "./routers/login.js";
server.use("/api/login", loginRouter);

export default server; 