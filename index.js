import * as dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from "http";
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from "./config/swagger.js";

import productsRoutes from "./routes/products.js";

import ApiError from "./errors/errors.js";
import errorHandler from "./middleware/errorHandler.js";
import { trackerJob } from "./jobs/tracker.js";
import cron from 'node-cron';

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
app.use('/api/products', productsRoutes);

app.use((req, res, next) => {
    next(ApiError.notFound("Route not found"));
  });
  
app.use(errorHandler);

server.listen(port, async () => {

  console.log('🕐 Running tracker job...');
  // Cron job to run tracker job every day at 16:21 (4:21 PM)
  // Cron expression: "21 16 * * *" means: minute 21, hour 16, every day of month, every month, every day of week
  await trackerJob();
  cron.schedule('15 12 * * *', async () => {
    console.log('🕐 Running scheduled tracker job at 12:15...');
    try {
      await trackerJob();
      console.log('✅ Tracker job completed successfully');
    } catch (error) {
      console.error('❌ Error running tracker job:', error);
    }
  });
  console.log(`Server is running on port ${port}...`)}
);