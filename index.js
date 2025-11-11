import * as dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from "http";
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from "./config/swagger.js";

import ApiError from "./errors/errors.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send({ 
    version: '1.0.0',
    message: `Server is running on port ${port}`,
    documentation: '/api/swagger'
  });
});

// Swagger UI
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Sundrops API Documentation'
}));

// Routes

app.use((req, res, next) => {
    next(ApiError.notFound("Route not found"));
  });
  
app.use(errorHandler);

server.listen(port, () => console.log(`Server is running on port ${port}...`));