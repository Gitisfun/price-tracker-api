import { dbClient } from '../config/supabase.js';

/**
 * Base service class for database operations
 * Provides common CRUD operations that can be extended by specific services
 */
export class BaseService {
    constructor(tableName) {
        if (!tableName) {
            throw new Error('Table name is required');
        }
        this.tableName = tableName;
        this.db = dbClient;
    }

    /**
     * Get all records (excluding soft-deleted ones)
     * @param {Object} options - Query options (filters, sorting, pagination)
     * @returns {Promise<Array>} Array of records
     */
    async getAll(options = {}) {
        try {
            let query = this.db
                .from(this.tableName)
                .select('*')
                .is('deleted_at', null);

            // Apply filters if provided
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            // Apply sorting if provided
            if (options.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending !== false
                });
            }

            // Apply pagination if provided
            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error(`Error getting all records from ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Get a single record by ID
     * @param {string|number} id - Record ID
     * @returns {Promise<Object|null>} Record or null if not found
     */
    async getById(id) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .select('*')
                .eq('id', id)
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
            console.error(`Error getting record by ID from ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Create a new record
     * @param {Object} record - Record data
     * @returns {Promise<Object>} Created record
     */
    async create(record) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .insert(record)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`Error creating record in ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Update a record by ID
     * @param {string|number} id - Record ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated record or null if not found
     */
    async update(id, updates) {
        try {
            // Add updated_at timestamp if the column exists
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await this.db
                .from(this.tableName)
                .update(updateData)
                .eq('id', id)
                .is('deleted_at', null)
                .select()
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
            console.error(`Error updating record in ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Soft delete a record by ID (sets deleted_at timestamp)
     * @param {string|number} id - Record ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .is('deleted_at', null)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return false;
                }
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error(`Error deleting record from ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Hard delete a record by ID (permanently removes from database)
     * @param {string|number} id - Record ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async hardDelete(id) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return false;
                }
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error(`Error hard deleting record from ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Find records by a specific field
     * @param {string} field - Field name to search
     * @param {any} value - Value to match
     * @returns {Promise<Array>} Array of matching records
     */
    async findBy(field, value) {
        try {
            const { data, error } = await this.db
                .from(this.tableName)
                .select('*')
                .eq(field, value)
                .is('deleted_at', null);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error(`Error finding records by ${field} in ${this.tableName}:`, error);
            throw error;
        }
    }
}

