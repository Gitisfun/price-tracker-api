import productsService from '../services/products.js';
import pricesService from '../services/prices.js';
import { trackPrice } from '../logic/scraper.js';

export const trackerJob = async () => {
  try {
    // Get all products from the database
    const products = await productsService.getAll();
    
    // Get all prices for today's date
    const prices = await pricesService.getAllPricesByDate();

    // Get product IDs that already have prices for today
    const productIdsWithPrices = new Set(prices.map(price => price.product_id));
    
    // Filter products to only include those without a price entry for today
    const productsToTrack = products.filter(product => !productIdsWithPrices.has(product.id));

    // For each product, scrape the price and create a price entry
    for (const product of productsToTrack) {
      try {
        const scrapedData = await trackPrice(product.url);

        // Only create a price record if the price was successfully scraped
        if (scrapedData.price !== null && scrapedData.price !== undefined) {
          await pricesService.createPrice({
            product_id: product.id,
            price: scrapedData.price,
            currency: 'EUR',
            date: scrapedData.date,
          });
          console.log(`✅ Successfully tracked price for product ${product.id}: ${scrapedData.price} EUR`);
        } else {
          console.warn(`⚠️ Skipping price record for product ${product.id} - price could not be scraped (URL: ${product.url})`);
        }
      } catch (error) {
        console.error(`❌ Error processing product ${product.id} (${product.url}):`, error.message);
        // Continue with next product instead of failing the entire job
      }
    }
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
};

