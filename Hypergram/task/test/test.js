const puppeteer = require('puppeteer');
const path = require('path');
const pagePath = 'file://' + path.resolve(__dirname, '../src/index.html');
const hs = require('hs-test-web');
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function stageTest() {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-infobar'],
        ignoreDefaultArgs: ['--enable-automation']
    });

    const page = await browser.newPage();
    await page.goto(pagePath);

    page.on('console', msg => console.log(msg.text()));

    await sleep(1000);

    let result = await hs.testPage(page,
        () => {
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
                    "There is should be an 'input' tag with type 'range' and with #brightness id!")
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
