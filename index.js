import * as dotenv from "dotenv";
dotenv.config();

import express from 'express';
import http from "http";
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from "./config/swagger.js";
import { trackPrice } from "./logic/scraper.js";

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

app.get('/api/track-price', async (req, res) => {
  const url = "https://www.bol.com/nl/nl/p/optimum-nutrition-gold-standard-100-whey-protein-vanilla-ice-cream-proteine-poeder-eiwitshake-900-gram/9300000006273787/?bltgh=tvxPUDvbwpBFeqBqy8tDxw.4_7.8.ProductTitle"
  //const url = "https://www.bol.com/nl/nl/p/xxl-nutrition-perfect-whey-protein-eiwitpoeder-proteine-poeder-eiwitshake-proteine-shake-vanille-750-gram/9200000085196736/?cid=1762882153772-8537869236811&bltgh=hkBUoWNPATO4vllCbvBOVw.4_58.59.ProductImage"
  const result = await trackPrice(url);
  res.json(result);
});

// Routes

app.use((req, res, next) => {
    next(ApiError.notFound("Route not found"));
  });
  
app.use(errorHandler);

server.listen(port, () => console.log(`Server is running on port ${port}...`));