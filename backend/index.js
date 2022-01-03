const express = require("express");
const cors = require("cors");

const server = express();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapidoc.yaml');

server.use(express.static('../frontend/build')) // react client starts from host url
server.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
server.use(cors()); // middleware
server.use(express.json()); // middleware

const placesRouter = require("./routers/places");
server.use("/api/places", placesRouter);

const userRouter = require("./routers/users");
server.use("/api/users", userRouter);

const loginRouter = require("./routers/login");
server.use("/api/login", loginRouter);

module.exports = server; 