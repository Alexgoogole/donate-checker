import puppeteer from 'puppeteer';

/**
 * Cloud Functions Gen2 HTTP handler for checking donation status
 * @param {Object} req - Cloud Functions request object
 * @param {Object} res - Cloud Functions response object
 */
export const checkDonation = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests for the main endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

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
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
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
};

/**
 * Cloud Functions Gen2 HTTP handler for health checks
 * @param {Object} req - Cloud Functions request object
 * @param {Object} res - Cloud Functions response object
 */
export const health = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok' });
};

/**
 * Main entry point for Cloud Functions Gen2
 * Routes requests to appropriate handlers
 * @param {Object} req - Cloud Functions request object
 * @param {Object} res - Cloud Functions response object
 */
export const app = async (req, res) => {
  // Route to health check endpoint
  if (req.path === '/health' || req.path === '/') {
    return health(req, res);
  }
  
  // Route to donation check endpoint
  return checkDonation(req, res);
};