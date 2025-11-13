import { BaseService } from './BaseService.js';

/**
 * Prices service
 * Handles all database operations for the prices table
 */
export class PricesService extends BaseService {
    constructor() {
        super('prices');
    }

    /**
     * Create a new price record
     * @param {Object} priceData - Price data (product_id, price, currency, date)
     * @returns {Promise<Object>} Created price record
     */
    async createPrice(priceData) {
        try {
            const price = {
                product_id: priceData.product_id,
                price: priceData.price,
                currency: priceData.currency || null,
                date: priceData.date || new Date().toISOString()
            };

            return await this.create(price);
        } catch (error) {
            console.error('Error creating price record:', error);
            throw error;
        }
    }

    /**
     * Get all prices for a specific product
     * @param {string} productId - Product ID
     * @param {Object} options - Query options (orderBy, limit, etc.)
     * @returns {Promise<Array>} Array of price records
     */
    async getByProductId(productId, options = {}) {
        try {
            const queryOptions = {
                ...options,
                filters: { product_id: productId },
                orderBy: options.orderBy || { column: 'date', ascending: false }
            };

            return await this.getAll(queryOptions);
        } catch (error) {
            console.error(`Error getting prices for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Get the latest price for a product
     * @param {string} productId - Product ID
     * @returns {Promise<Object|null>} Latest price record or null if not found
     */
    async getLatestPrice(productId) {
        try {
            const prices = await this.getByProductId(productId, {
                limit: 1,
                orderBy: { column: 'date', ascending: false }
            });

            return prices.length > 0 ? prices[0] : null;
        } catch (error) {
            console.error(`Error getting latest price for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Get the previous price for a product (the price before the latest one)
     * @param {string} productId - Product ID
     * @returns {Promise<Object|null>} Previous price record or null if not found
     */
    async getPreviousPrice(productId) {
        try {
            const prices = await this.getByProductId(productId, {
                limit: 2,
                orderBy: { column: 'date', ascending: false }
            });

            // Return the second price (index 1) if it exists, otherwise null
            return prices.length > 1 ? prices[1] : null;
        } catch (error) {
            console.error(`Error getting previous price for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Get price for a product on a specific date
     * @param {string} productId - Product ID
     * @param {string} date - Date to get price for (ISO string)
     * @returns {Promise<Object|null>} Price record for the specified date or null if not found
     */
    async getPriceByDate(productId, date) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .select('*')
                .eq('product_id', productId)
                .eq('date', date)
                .is('deleted_at', null)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`Error getting price by date for product ${productId}:`, error);
            throw error;
        }
    }

    /**
     * Get all prices for a specific date (across all products)
     * @param {string} date - Date to get prices for (ISO string)
     * @param {Object} options - Optional query options (orderBy, limit, etc.)
     * @returns {Promise<Array>} Array of price records for the specified date
     */
    async getAllPricesByDate(date = new Date().toISOString(), options = {}) {
        try {
            const queryOptions = {
                ...options,
                filters: { date: date }
            };

            return await this.getAll(queryOptions);
        } catch (error) {
            console.error(`Error getting all prices by date ${date}:`, error);
            throw error;
        }
    }

    /**
     * Get prices within a date range for a product
     * @param {string} productId - Product ID
     * @param {string} startDate - Start date (ISO string)
     * @param {string} endDate - End date (ISO string)
     * @returns {Promise<Array>} Array of price records
     */
    async getPricesByDateRange(productId, startDate, endDate) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .select('*')
                .eq('product_id', productId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error(`Error getting prices by date range for product ${productId}:`, error);
            throw error;
        }
    }
}

// Export a singleton instance
export const pricesService = new PricesService();
export default pricesService;

