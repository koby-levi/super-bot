const axios = require('axios');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { spawn } = require('child_process');



let browserInstance = null; // first instance of Chrome

const affiliateLink = "s.click.aliexpress.com";



//===========================================================//
// getLongUrl - Expands any short URL if possible
async function getLongUrl(shortUrl) {
    try {
        //console.log(`Expanding URL: ${shortUrl}`);

        const response = await axios.get(shortUrl, {
            maxRedirects: 0,  // מונע מ-axios לבצע את ההפניה בעצמו
            validateStatus: status => status >= 300 && status < 400, // מזהה רק סטטוסי הפניה
        });

        return response.headers.location || shortUrl;
    } catch (error) {
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            return error.response.headers.location || shortUrl;
        }
        console.error(`Failed to expand URL: ${shortUrl}`, error.message);
        return shortUrl; // אם אין הפניה, מחזיר את הקישור המקורי
    }
}

//===========================================================//
// remove affiliate and add sourceType is exist..
async function cleanUrlWithSourceType(url) {
    try {
        const urlObj = new URL(url);
        const sourceType = urlObj.searchParams.get('sourceType'); // בדיקה אם קיים sourceType

        // בניית URL חדש
        const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
        
        // אם sourceType קיים, מוסיפים אותו
        if (sourceType) {
           // return `${cleanUrl}?sourceType=${sourceType}`;
			return { isSC: true, url: `${cleanUrl}?sourceType=${sourceType}`};
        }

        //return cleanUrl; // אם אין sourceType מחזירים רק את ה-URL הבסיסי
         return { isSC: false, url: cleanUrl }; // אם אין sourceType מחזירים רק את ה-URL הבסיסי
		
    } catch (error) {
        console.error('Invalid URL:', error);
        return null;
    }
}
//===========================================================//
async function addSourceType(url,sourceType = '561') {
    try {
        const urlObj = new URL(url);
        return `${urlObj.origin}${urlObj.pathname}?sourceType=${sourceType}`;
    } catch (error) {
        return null;
    }
}
//===========================================================//

async function getPrice(url, retries = 3) {
    const browser = await puppeteer.launch({ headless: true, userDataDir: "./puppeteer_session" });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // מחכה שהמחיר יופיע, עד 10 שניות
        await page.waitForSelector('.price--currentPriceText--V8_y_b5', { timeout: 10000 });

        const price = await page.evaluate(() => {
            const priceElement = document.querySelector('.price--currentPriceText--V8_y_b5');
            return priceElement ? priceElement.innerText.trim() : null;
        });

        await browser.close();

        if (!price && retries > 0) {
            console.log(`מחיר לא נמצא, מנסה שוב... (נשארו ${retries} נסיונות)`);
            return await getPrice(url, retries - 1);
        }

        return { success: !!price, price: price || 'לא נמצא מחיר' };
    } catch (error) {
        console.error(`שגיאה בטעינת הדף: ${error.message}`);
        await browser.close();
        return { success: false, price: 'שגיאה בקבלת הנתונים' };
    }
}

//======================== Launch Chrome ====================//
async function launchChrome() {
    console.log('🚀 Launching Chrome with saved session...');

    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true, // השאר פתוח כדי לראות מה קורה
            userDataDir: "./puppeteer_session", // 🔹 שמירת הסשן כאן!
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        console.log("✅ Chrome launched.");
    }
    return browserInstance;
}

//======================== Get Browser Instance ====================//
async function getBrowserInstance() {
    if (!browserInstance) {
        console.log('🚀 No browser instance found. Launching...');
        browserInstance = await launchChrome();
    }
    return browserInstance;
}

//========================================================//

////===========================================================//
//async function getBrowserInstance() {
//    if (!browserInstance) {
//        console.log('No browser instance found. Launching Chrome...');
//        await launchChrome();
//
//        let attempts = 0;
//        const maxAttempts = 10;
//
//        while (!browserInstance && attempts < maxAttempts) {
//            try {
//                browserInstance = await puppeteer.connect({
//                    browserURL: 'http://127.0.0.1:9222',
//                    defaultViewport: { width: 1280, height: 800 },
//                });
//                console.log('Connected to Chrome.');
//            } catch (err) {
//                attempts++;
//                console.log(`Waiting for Chrome to be ready... (${attempts}/${maxAttempts})`);
//                await new Promise(resolve => setTimeout(resolve, 1000));
//            }
//        }
//
//        if (!browserInstance) {
//            throw new Error('Failed to connect to Chrome.');
//        }
//    }
//
//    return browserInstance;
//}

//async function launchChrome() {
//    console.log('Launching Chrome...');
//    const chromeProcess = spawn(
//        `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`,
//        [
//            '--remote-debugging-port=9222',
//            '--user-data-dir=C:\\ChromeDebugProfile',
//            '--no-first-run',
//            '--no-default-browser-check',
//            '--disable-background-timer-throttling',
//            '--disable-renderer-backgrounding',
//            '--disable-backgrounding-occluded-windows',
//            '--disable-dev-shm-usage',
//            '--disable-accelerated-2d-canvas',
//            '--disable-gpu',
//            '--window-size=1280,800',
//        ],
//        { shell: true, detached: true, stdio: 'ignore' }
//    );
//
//    chromeProcess.unref();
//}

async function automateLinkGenerator(exampleUrl) {
    const browser = await getBrowserInstance();
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // שינוי User-Agent כדי להיראות כמו דפדפן רגיל
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36');

    console.log('Navigating to AliExpress...');
    await page.goto('https://portals.aliexpress.com/affiportals/web/link_generator.htm', { waitUntil: 'networkidle2' });
    console.log(`Current URL: ${await page.url()}`);

    try {
        console.log('Page loaded. Automating...');
        await page.waitForSelector('.page-title .title', { timeout: 30000 });
        await page.waitForSelector('#targetUrl', { timeout: 30000 });
        await page.type('#targetUrl', exampleUrl);
        await page.click('.link-form-submit');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const errorMessageSelector = '.next-message-title';
        const isErrorVisible = await page.$(errorMessageSelector);
        if (isErrorVisible) {
            const errorText = await page.$eval(errorMessageSelector, el => el.textContent.trim());
            if (errorText.includes("Non-affiliate items can't be used to generate links")) {
                //console.error('Error detected:', errorText);
				console.log(`Non-affiliate items :( -> send regular ${exampleUrl}`);
                return { success: true, trackingLink: exampleUrl };
                //return { success: false, message: errorText + ': ' + exampleUrl };
            }
        }

        await page.waitForSelector('.link-form-text textarea', { timeout: 30000 });
        const trackingLink = await page.$eval('.link-form-text textarea', el => el.value.trim());

        if (trackingLink) {
            console.log(`Automation success-> Tracking Link: ${trackingLink}`);
            return { success: true, trackingLink: trackingLink };
        } else {
            console.error('Error: Tracking link is empty!');
            return { success: false, message: 'Tracking link is empty!' };
        }
    } catch (error) {
        console.error('Error during automation:', error);
        return { success: false, message: error.message };
    }
}

//isValidAliExpressLink
//===========================================================//
const isValidAliExpressLink = (url) => {
    return /^(https?:\/\/(s\.click\.aliexpress\.com|he\.aliexpress\.com|aliexpress\.com|www\.aliexpress\.com|a\.aliexpress\.com))/.test(url);
};
//===========================================================//

module.exports = { getPrice , getLongUrl , automateLinkGenerator , cleanUrlWithSourceType ,addSourceType, isValidAliExpressLink};

//==============================================================//
