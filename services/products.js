import { BaseService } from './BaseService.js';

/**
 * Products service
 * Handles all database operations for the products table
 */
export class ProductsService extends BaseService {
    constructor() {
        super('products');
    }

    /**
     * Create a new product
     * @param {Object} productData - Product data (id, title, url)
     * @returns {Promise<Object>} Created product
     */
    async createProduct(productData) {
        try {
            const product = {
                id: productData.id,
                title: productData.title,
                url: productData.url,
                name: productData.name,
                created_at: new Date().toISOString(),
            };

            return await this.create(product);
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    /**
     * Get product by URL (useful for checking if product already exists)
     * @param {string} url - Product URL
     * @returns {Promise<Object|null>} Product or null if not found
     */
    async getByUrl(url) {
        try {
            const products = await this.findBy('url', url);
            return products.length > 0 ? products[0] : null;
        } catch (error) {
            console.error(`Error getting product by URL: ${url}`, error);
            throw error;
        }
    }

    /**
     * Update product by ID
     * @param {string} id - Product ID
     * @param {Object} updates - Fields to update (title, url)
     * @returns {Promise<Object|null>} Updated product or null if not found
     */
    async updateProduct(id, updates) {
        try {
            return await this.update(id, updates);
        } catch (error) {
            console.error(`Error updating product ${id}:`, error);
            throw error;
        }
    }
}

// Export a singleton instance
export const productsService = new ProductsService();
export default productsService;

