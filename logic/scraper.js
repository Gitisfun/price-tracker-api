import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";

export const trackPrice = async (url) => {
    try {
        // Generate a hash-based ID from the URL
        const id = crypto.createHash('sha256').update(url).digest('hex');
        // Get current date in ISO format
        const date = new Date().toISOString();
        
        console.log("🆔 Generated ID from URL:", id);
        const response = await axios.get(url);
        
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract title from h1 with span[data-test="title"]
        const titleElement = $('h1.page-heading span[data-test="title"]');
        const title = titleElement.length > 0 ? titleElement.text().trim() : null;
        
        if (title) {
            console.log("📝 Extracted title:", title);
        } else {
            console.warn("⚠️ Could not find title element");
        }

        // First, find the section with data-test="prices" (buy block section)
        const priceSection = $('section[data-test="prices"]');
        
        if (priceSection.length === 0) {
            console.error("❌ Could not find price section");
            return { id, url, price: null, title, date };
        }

        // Within that section, find the span with data-test="price"
        const priceSpan = priceSection.find('span[data-test="price"]');
        
        if (priceSpan.length === 0) {
            console.error("❌ Could not find price span element within price section");
            return { id, url, price: null, title, date };
        }

        // Get the main price (e.g., "38")
        const mainPrice = priceSpan.clone().children().remove().end().text().trim();
        
        // Get the fraction from the sup element (e.g., "90")
        const fraction = priceSpan.find('sup[data-test="price-fraction"]').text().trim();
        
        console.log("📝 Main price:", mainPrice);
        console.log("📝 Fraction:", fraction);

        if (!mainPrice || !fraction) {
            console.error("❌ Could not extract price components");
            return { id, url, price: null, title, date };
        }

        // Combine them (e.g., "38" + "." + "90" = 38.90)
        const fullPrice = parseFloat(`${mainPrice}.${fraction}`);
        console.log("fullPrice", fullPrice);
        if (isNaN(fullPrice)) {
            console.error("❌ Invalid price value");
            return { id, url, price: null, title, date };
        }

        console.log("💰 Extracted price:", fullPrice);
        return { id, url, price: fullPrice, title, date };
    } catch (error) {
        console.log("error", error)
        console.error("❌ Error scraping price:", error.message);
        console.error(error.stack);
        // Generate ID even on error
        const id = crypto.createHash('sha256').update(url).digest('hex');
        const date = new Date().toISOString();
        return { id, url, price: null, title: null, date };
    }
}

