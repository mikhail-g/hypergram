const puppeteer = require('puppeteer');
const pixels = require('image-pixels')
const path = require('path');

const hs = require('hs-test-web');
const {onPage} = require('hs-test-web');
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const pagePath = 'file://' + path.resolve(__dirname, '../src/index.html');
const filePath = path.resolve(__dirname, '../test/testImage.png');

async function stageTest() {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-infobar'],
        ignoreDefaultArgs: ['--enable-automation'],
        devtools: true
    });

    const page = await browser.newPage();
    await page.goto(pagePath);

    page.on('console', msg => console.log(msg.text()));

    await sleep(1000);

    let result = await hs.test(
        onPage(page, () => {
            const canvas = document.getElementsByTagName("canvas");
            if (canvas.length !== 1) {
                return hs.wrong("There is should be 1 canvas element in the page!")
            }

            const uploadButton = document.querySelector("input[type='file']#file-input");
            if (uploadButton === null) {
                return hs.wrong("Can't find a file upload input field. It should have type 'file' and #file-input id.")
            }

            const brightnessSlider = document.querySelector("input[type='range']#brightness");
            if (brightnessSlider === null) {
                return hs.wrong("Can't slider for brightness parameter. " +
                    "There is should be an 'input' tag with type 'range' and with #brigtness id!")
            }

            const contrastSlider = document.querySelector("input[type='range']#contrast");
            if (contrastSlider === null) {
                return hs.wrong("Can't slider for contrast parameter. " +
                    "There is should be an 'input' tag with type 'range' and with #contrast id!")
            }

            const transparent = document.querySelector("input[type='range']#transparent");
            if (transparent === null) {
                return hs.wrong("Can't slider for transparent parameter. " +
                    "There is should be an 'input' tag with type 'range' and with #transparent id!")
            }

            const saveButton = document.querySelector("button#save-button");
            if (saveButton === null) {
                return hs.wrong("Can't find a button with #save-button id!")
            }

            return hs.correct()
        }),
        async () => {
            const uploadButton = await page.$("input[type='file']#file-input");
            await uploadButton.uploadFile(filePath);
            await uploadButton.evaluate(upload => upload.dispatchEvent(new Event('change', {bubbles: true})));
            await sleep(500)

            const userPixels = await page.evaluate(() => {
                const canvas = document.getElementsByTagName("canvas")[0];
                if (canvas.width !== 30 || canvas.height !== 30) {
                    return hs.wrong("After uploading an image into canvas it has wrong size!")
                }
                const ctx = canvas.getContext("2d");
                return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            });

            const {data} = await pixels(filePath)

            if (data.length !== Object.keys(userPixels).length) {
                return hs.wrong("Wrong number ox pixels on the canvas!")
            }

            for (let i = 0; i < data.length; i++) {
                if (data[i] !== userPixels[i]) {
                    return hs.wrong("Looks like some of the pixels have wrong RGB value!")
                }
            }

            return hs.correct()
        }
    );

    await browser.close();
    return result;
}


jest.setTimeout(30000);
test("Test stage", async () => {
        let result = await stageTest();
        if (result['type'] === 'wrong') {
            fail(result['message']);
        }
    }
);
