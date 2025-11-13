import express from 'express';
import productsService from '../services/products.js';
import pricesService from '../services/prices.js';
import { trackPrice } from '../logic/scraper.js';
import { validateCreateProduct } from '../schemas/products.js';
import ApiError from '../errors/errors.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of products with optional filtering, searching, sorting, and pagination. Supports substring search across multiple columns. Each product includes the latest price, previous price, and the rate of change between them.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (substring) to search for in product fields
 *         example: laptop
 *       - in: query
 *         name: searchColumns
 *         schema:
 *           type: string
 *         description: Comma-separated list of column names to search in. If not provided, defaults to 'title,name'
 *         example: title,name
 *       - in: query
 *         name: filter[field]
 *         schema:
 *           type: string
 *         description: Filter by exact field value. Replace 'field' with the actual field name. Can be used multiple times.
 *         example: filter[status]=active
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: Column name to sort by
 *         example: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *         example: desc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of results to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip (for pagination)
 *         example: 0
 *     responses:
 *       200:
 *         description: Successful response with list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *             examples:
 *               default:
 *                 summary: List of products with price information
 *                 value:
 *                   - id: "prod_123"
 *                     title: "Laptop Computer"
 *                     name: "Laptop Computer"
 *                     url: "https://example.com/product/laptop"
 *                     created_at: "2024-01-15T10:30:00Z"
 *                     updated_at: "2024-01-15T10:30:00Z"
 *                     deleted_at: null
 *                     latestPrice: 38.90
 *                     latestPriceDate: "2024-01-15T10:30:00Z"
 *                     previousPrice: 39.99
 *                     previousPriceDate: "2024-01-14T08:20:00Z"
 *                     priceChangeRate: -2.73
 *                   - id: "prod_456"
 *                     title: "Gaming Mouse"
 *                     name: "Gaming Mouse"
 *                     url: "https://example.com/product/mouse"
 *                     created_at: "2024-01-14T08:20:00Z"
 *                     updated_at: "2024-01-14T08:20:00Z"
 *                     deleted_at: null
 *                     latestPrice: 25.50
 *                     latestPriceDate: "2024-01-14T08:20:00Z"
 *                     previousPrice: null
 *                     previousPriceDate: null
 *                     priceChangeRate: null
 *       400:
 *         description: Bad request (e.g., invalid search columns)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res, next) => {
  try {
    const options = {};

    // Parse search parameters
    if (req.query.search) {
      const searchColumns = req.query.searchColumns 
        ? req.query.searchColumns.split(',').map(col => col.trim())
        : [];

      if (searchColumns.length === 0) {
        // Default search columns for products if none specified
        options.search = {
          term: req.query.search,
          columns: ['title', 'name']
        };
      } else {
        options.search = {
          term: req.query.search,
          columns: searchColumns
        };
      }
    }

    // Parse filter parameters (format: filter[field]=value)
    const filters = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const field = key.slice(7, -1); // Extract field name from filter[field]
        filters[field] = req.query[key];
      }
    });
    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }

    // Parse sorting parameters
    if (req.query.orderBy) {
      options.orderBy = {
        column: req.query.orderBy,
        ascending: req.query.order !== 'desc'
      };
    }

    // Parse pagination parameters
    if (req.query.limit) {
      options.limit = parseInt(req.query.limit, 10);
    }
    if (req.query.offset) {
      options.offset = parseInt(req.query.offset, 10);
    }

    const products = await productsService.getAll(options);
    
    // Enrich products with price information
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const latestPrice = await pricesService.getLatestPrice(product.id);
        const previousPrice = await pricesService.getPreviousPrice(product.id);
        
        let priceChangeRate = null;
        if (latestPrice && previousPrice && previousPrice.price !== null && previousPrice.price !== 0) {
          // Calculate rate of change as percentage: ((new - old) / old) * 100
          priceChangeRate = ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100;
        }
        
        return {
          ...product,
          latestPrice: latestPrice ? latestPrice.price : null,
          latestPriceDate: latestPrice ? latestPrice.date : null,
          previousPrice: previousPrice ? previousPrice.price : null,
          previousPriceDate: previousPrice ? previousPrice.date : null,
          priceChangeRate: priceChangeRate !== null ? parseFloat(priceChangeRate.toFixed(2)) : null
        };
      })
    );
    
    res.json(productsWithPrices);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product and track its price
 *     description: |
 *       Creates a new product by scraping data from the provided URL. 
 *       The endpoint will:
 *       - Check if a product with the URL already exists (returns error if it does)
 *       - Scrape product information (title, price) from the URL
 *       - Create a product record in the database
 *       - Create an initial price entry for tracking
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 minLength: 1
 *                 maxLength: 500
 *                 example: "Laptop Computer"
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Product URL to scrape
 *                 maxLength: 2048
 *                 example: "https://www.bol.com/nl/nl/p/laptop/12345678/"
 *           examples:
 *             example1:
 *               summary: Create a laptop product
 *               value:
 *                 name: "Laptop Computer"
 *                 url: "https://www.bol.com/nl/nl/p/laptop/12345678/"
 *     responses:
 *       200:
 *         description: Product created successfully with scraped data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Product'
 *                 - type: object
 *                   properties:
 *                     scrapedPrice:
 *                       type: number
 *                       nullable: true
 *                       description: Price scraped from the URL
 *                       example: 38.90
 *                     scrapedDate:
 *                       type: string
 *                       format: date-time
 *                       description: Date when the price was scraped
 *                       example: "2024-01-15T10:30:00Z"
 *             examples:
 *               success:
 *                 summary: Product created successfully
 *                 value:
 *                   id: "a1b2c3d4e5f6..."
 *                   title: "Laptop Computer"
 *                   name: "Laptop Computer"
 *                   url: "https://www.bol.com/nl/nl/p/laptop/12345678/"
 *                   created_at: "2024-01-15T10:30:00Z"
 *                   updated_at: "2024-01-15T10:30:00Z"
 *                   deleted_at: null
 *                   scrapedPrice: 38.90
 *                   scrapedDate: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Bad request - Validation failed or product already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Validation failed"
 *                     details:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Product name is required", "Product URL must be a valid URL"]
 *                 - type: string
 *                   example: "Product with this URL already exists"
 *             examples:
 *               validationError:
 *                 summary: Validation error
 *                 value:
 *                   error: "Validation failed"
 *                   details: ["Product name is required", "Product URL must be a valid URL"]
 *               duplicateProduct:
 *                 summary: Product already exists
 *                 value: "Product with this URL already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate the request body
    const validatedData = await validateCreateProduct(req.body);

    // Check if product already exists by URL
    const existingProduct = await productsService.getByUrl(validatedData.url);
    
    if (existingProduct) throw ApiError.badRequest('Product with this URL already exists');

    // Scrape product data from the URL
    const scrapedData = await trackPrice(validatedData.url);

    // Create new product using scraped data and validated name
    const product = await productsService.createProduct({
      id: scrapedData.id,
      title: scrapedData.title || validatedData.name,
      url: scrapedData.url,
      name: validatedData.name,
    });

    // Create price entry if price was successfully scraped
    if (scrapedData.price !== null) {
      await pricesService.createPrice({
        product_id: product.id,
        price: scrapedData.price,
        currency: 'EUR', // Default currency, can be made configurable
        date: scrapedData.date,
      });
    }

    // Return the product with the scraped data
    res.json({
      ...product,
      scrapedPrice: scrapedData.price,
      scrapedDate: scrapedData.date,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
});

export default router;
