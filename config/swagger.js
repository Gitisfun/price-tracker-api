import swaggerJsdoc from 'swagger-jsdoc';

const port = process.env.PORT || 3000;

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
