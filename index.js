import puppeteer, { TimeoutError } from 'puppeteer';
import { } from 'dotenv/config';

const DEBUG = process.env.DEBUG || false; // Set to true to see the browser in action
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || 'http://192.168.100.1';
const ROUTER_USERNAME = process.env.ROUTER_USERNAME || 'admin';
const ROUTER_PASSWORD = process.env.ROUTER_PASSWORD || ''; // Check the label under the router for the default password
const SSID_PORT_ID = process.env.SSID_PORT_ID || 'SSID-5';
const REPEAT_COUNT = process.env.REPEAT_COUNT || 3;

// Device MAC Addresses
const TEST = process.env.TEST || '11:22:33:44:55:66';
const MYDEVICE = process.env.MYDEVICE || '11:22:33:44:55:66';
const NAUGHTYBOI = process.env.NAUGHTYBOI || '11:22:33:44:55:66';

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}

const getRandomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const chooseDevice = () => {
  switch (process.env?.DEVICE?.toLowerCase()) {
    case 'test':
      return TEST;
    case 'mydevice':
      return MYDEVICE;
    case 'naughtyboi':
      return NAUGHTYBOI;
    default:
      return TEST;
  }
}

const CURRENT_DEVICE_MAC_ADDRESS = chooseDevice();

const chooseDeviceDelay = () => {
  const veryShortDelay = getRandomDelay(1000, 2000);
  const shortDelay = getRandomDelay(5000, 10000);
  const longDelay = getRandomDelay(20000, 60000);
  const veryLongDelay = getRandomDelay(30000, 120000); // Now this is just ridiculous

  switch (process.env?.DURATION?.toLowerCase()) {
    case 'veryshort':
      return veryShortDelay;
    case 'short':
      return shortDelay;
    case 'long':
      return longDelay;
    default:
      return shortDelay;
  }
}

(async () => {
  const launchOptions = DEBUG === 'true' ?
    {
      headless: false,
      args: ["--no-sandbox", "--window-position=2561,0"], // Opens on your 2nd monitor if you have one. For 1920x1080p screens use 1921,0}
    } : {
      headless: true
    };

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  // Accept dialog
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  // Navigate the page to a URL
  await page.goto(ROUTER_ADDRESS);

  // Set screen size
  await page.setViewport({ width: 1080, height: 1024 });

  //---------- LOGIN ----------//
  // Type into username box
  await page.type('#txt_Username', ROUTER_USERNAME);

  // Type into password box
  await page.type('#txt_Password', ROUTER_PASSWORD);

  // Click on login button
  await page.evaluate(() => document.querySelector('#loginbutton').click());

  // Wait for page to load fully
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
  //---------- END LOGIN ----------//

  //---------- WI-FI MAC FILTERING TAB ----------//
  // Click on Advanced tab
  await page.evaluate(() => document.querySelector('#name_addconfig').click());

  // Click on Security Dropdown
  await page.evaluate(() => document.querySelector('#name_securityconfig').click());

  // Click on Wi-Fi MAC Filtering tab
  await page.evaluate(() => document.querySelector('#wlanmacfilter').click());
  //---------- END WI-FI MAC FILTERING TAB ----------//


  //---------- MENU IFRAME ----------//
  // Wait for iframe and its elements to load
  const iframe = await page.$('#menuIframe');
  const frame = await iframe.contentFrame();
  await frame.waitForSelector('#EnableMacFilter'); // Toggle checkbox
  await frame.waitForSelector('#Newbutton'); // New button
  await frame.waitForSelector('#DeleteButton'); // Delete button
  await frame.waitForSelector('#ssidindex'); // SSID Index dropdown
  await frame.waitForSelector('#SelDeviceName'); // Device name dropdown
  await frame.waitForSelector('#DeviceName'); // Device name input
  await frame.waitForSelector('#SourceMACAddress'); // Source MAC Address input
  await frame.waitForSelector('#btnApply_ex'); // Apply button
  //---------- END MENU IFRAME ----------//

  //---------- TOGGLE WIFI MAC FILTERING ----------//
  const toggleWifiMacFiltering = async () => {
    // Click on Enable WLAN MAC Filter checkbox
    const toggleCheckbox = await frame.$('#EnableMacFilter');
    await frame.evaluate(() => document.querySelector('#EnableMacFilter').click());
    console.log(`Toggled Wi-Fi Mac Filtering: ${await (await toggleCheckbox.getProperty('checked')).jsonValue() ? 'ON' : 'OFF'}!`);

    // Wait for iframe to load fully
    await frame.waitForNavigation({
      waitUntil: 'networkidle0',
    });
  }
  //---------- END TOGGLE WIFI MAC FILTERING ----------//


  //---------- ADD DEVICE ----------//
  const addDevice = async () => {
    // Click on New button
    await frame.evaluate(() => document.querySelector('#Newbutton').click());

    // To find out what SSID Port ID you need, go to: Home Page -> Wi-Fi Devices -> Port ID
    // Click on SSID Index -> SSID5
    await frame.select('#ssidindex', SSID_PORT_ID);

    // Type into Device name box
    await frame.type('#DeviceName', 'Naughty boi');

    // Type into Source MAC Address box
    await frame.type('#SourceMACAddress', CURRENT_DEVICE_MAC_ADDRESS);

    // Click on Apply button
    await frame.evaluate(() => document.querySelector('#btnApply_ex').click());

    // Wait for iframe to load fully
    await frame.waitForNavigation({
      waitUntil: 'networkidle0',
    });
    console.log(`Added device: ${process.env?.DEVICE} ${CURRENT_DEVICE_MAC_ADDRESS}!`);
  }
  //---------- END ADD DEVICE ----------//


  //---------- REMOVE DEVICE ----------//
  const removeDevice = async () => {
    await frame.waitForSelector('#WMacfilterConfigList_rml0'); // Wait for device in table

    // Select checkbox in the first row
    await frame.evaluate(() => document.querySelector('#WMacfilterConfigList_rml0').click());

    // Click on Delete button
    await frame.evaluate(() => document.querySelector('#DeleteButton').click());

    // Wait for iframe to load fully
    await frame.waitForNavigation({
      waitUntil: 'networkidle0',
    });
    console.log(`Removed device: ${process.env?.DEVICE} ${CURRENT_DEVICE_MAC_ADDRESS}!`);
  }
  //---------- END REMOVE DEVICE ----------//


  //---------- RESET SETTINGS ----------//
  const resetSettings = async () => {
    try {
      await frame.waitForSelector('#WMacfilterConfigList_record_no', { timeout: 3000 }); // Check if table is empty
    } catch (e) {
      if (e instanceof TimeoutError) {
        await removeDevice();
      }
    }

    try {
      const toggleCheckbox = await frame.$('#EnableMacFilter');
      if (await (await toggleCheckbox.getProperty('checked')).jsonValue()) {
        await toggleWifiMacFiltering();
      } else {
        return;
      }
    } catch {
      console.log("Something went wrong!");
    } finally {
      console.log("\nSettings reset!\n");
    }
  }
  //---------- END RESET SETTINGS ----------//


  //---------- TOGGLE WIFI HELPER ----------//
  const toggleWifiMacFilteringHelper = async (times) => {
    for (let i = 0; i < times; i++) {
      toggleWifiMacFiltering();
      const delayTime = chooseDeviceDelay();
      await delay(delayTime);
      console.log(`Delaying for ${delayTime}ms!`);
    }
  };
  //---------- END TOGGLE WIFI HELPER ----------//


  //---------- EXECUTE SCRIPT ----------//
  console.log("\n===== Script started! =====\n\n");
  console.log(`Device: ${process.env?.DEVICE} - ${chooseDevice()}`);
  console.log(`Duration: ${process.env?.DURATION}`);

  await resetSettings();
  await addDevice();

  // Will toggle Wi-Fi Mac Filtering REPEAT_COUNT times. Default is 3 times.
  await toggleWifiMacFilteringHelper(REPEAT_COUNT);

  await resetSettings();
  console.log("===== Script ended! =====\n\n");
  //---------- END EXECUTE SCRIPT ----------//

  // Close the browser
  await browser.close();
})();
