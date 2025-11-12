import { object, string } from 'yup';

/**
 * Yup schema for creating a new product (POST /api/products)
 * Validates name and url fields
 */
export const createProductSchema = object({
  name: string()
    .required('Product name is required')
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(500, 'Product name must be less than 500 characters'),
  
  url: string()
    .required('Product URL is required')
    .trim()
    .url('Product URL must be a valid URL')
    .max(2048, 'Product URL must be less than 2048 characters'),
});

/**
 * Validate product data using the create schema
 * @param {Object} data - Product data to validate (must contain name and url)
 * @returns {Promise<Object>} Validated product data
 * @throws {ValidationError} If validation fails
 */
export const validateCreateProduct = async (data) => {
  return await createProductSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
};
