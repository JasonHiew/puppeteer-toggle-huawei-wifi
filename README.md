# Preview
https://github.com/JasonHiew/puppeteer-toggle-huawei-wifi/assets/24473087/3923d1be-dc6c-4283-80ed-2de10f820e7f

# Readme

## What is this?
This is a script that will toggle Wi-Fi Mac Filtering on and off randomly for one lucky person :D on a `Huawei HG8145V5` using Puppeteer.

## But, *why*?
If you've ever had a housemate who blasts music at 3am, you'll understand. 

## How does it work?
The script will log into the router, and then toggle the Wi-Fi Mac Filtering on and off randomly. It will then wait for a random amount of time before doing it again. 

## How to use?
Modify the `.env` file appropriately. 
`ROUTER_ADDRESS`, `ROUTER_USERNAME` and `ROUTER_PASSWORD` are self explanatory.

Take note also of the `SSID Port ID` which could be `SSID-1`, `SSID-2` or `SSID-5` from my testing.

I have included 3 devices in the `.env` file which are `TEST`, `MYDEVICE` and `NAUGHTYBOI` for quick testing.

Modify the MAC addresses in `.env` file to match the devices you want to control. Then run the script with ENV variables for `DEVICE` and `DURATION`.

You may modify the `REPEAT_COUNT` in the `.env` file to change the number of times the script will toggle the Wi-Fi Mac Filtering on and off.

## Okay, how do I *actually run it*?
`yarn install`
\
`DEVICE=naughtyboi DURATION=long node index.js`
