import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || 3014;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Price Tracker API',
      version: '1.0.0',
      description: 'API documentation for pricer tracker application',
      contact: {
        name: 'API Support',
        email: 'support@price-tracker.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique product identifier',
              example: 'prod_123'
            },
            title: {
              type: 'string',
              description: 'Product title',
              example: 'Laptop Computer'
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Laptop Computer'
            },
            url: {
              type: 'string',
              format: 'uri',
              description: 'Product URL',
              example: 'https://example.com/product/laptop'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Product creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Product last update timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            deleted_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Product deletion timestamp (null if not deleted)',
              example: null
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            count: {
              type: 'integer',
              description: 'Number of items returned (for list endpoints)'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerOptions, swaggerSpec };
