import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/check-donation', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      error: 'URL is required',
      usage: 'Send POST request with { "url": "https://send.monobank.ua/jar/..." }'
    });
  }

  let browser;
  try {
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
      ]
    };

    // Launch headless browser
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // Navigate to the donation URL
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Check if the paid-rolling image exists
    const donationClosed = await page.$('img.paid-rolling[src="/img/paid_rolling.svg"]');

    await browser.close();

    res.json({ 
      donationClosed: !!donationClosed,
      url: url
    });

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    console.error('Error checking donation status:', error);
    res.status(500).json({ 
      error: 'Failed to check donation status',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Only start the server when running locally (not inside Cloud Functions/Cloud Run)
if (!process.env.K_SERVICE && !process.env.FUNCTION_TARGET) {
  app.listen(PORT, () => {
    console.log(`Donation checker server running on port ${PORT}`);
    console.log(`Send POST requests to http://localhost:${PORT}/check-donation`);
  });
}

// Export the Express app for Google Cloud Functions (HTTP gen2)
export { app };