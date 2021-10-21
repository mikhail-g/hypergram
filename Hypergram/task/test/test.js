const puppeteer = require('puppeteer');
const pixels = require('image-pixels')
const path = require('path');

const hs = require('hs-test-web');
const {onPage} = require('hs-test-web');
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const pagePath = 'file://' + path.resolve(__dirname, '../src/index.html');
const imageFolderPath = path.resolve(__dirname, '../test/images/');
const initImage = imageFolderPath + '/testImage.png'
const brightnessTestImage = imageFolderPath + '/testBrightness.png'
const contrastTestImage = imageFolderPath + '/testContrast.png'
const transparentTestImage = imageFolderPath + '/testTransparent.png'
const multipleFilterTestImage = imageFolderPath + '/testMultipleFilters.png'

function comparePixels(userPixels, correctPixels, errorMessage) {
    if (correctPixels.length !== Object.keys(userPixels).length) {
        return hs.wrong("Wrong number ox pixels on the canvas!")
    }

    for (let i = 0; i < correctPixels.length; i++) {
        if (correctPixels[i] !== userPixels[i]) {
            return hs.wrong(errorMessage)
        }
    }
}


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
            this.getPixels = () => {
                const canvas = document.getElementsByTagName("canvas")[0];
                if (canvas.width !== 30 || canvas.height !== 30) {
                    return hs.wrong("After uploading an image into canvas it has wrong size!")
                }
                const ctx = canvas.getContext("2d");
                return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            }
            return hs.correct()
        }),
        onPage(page, () => {
            this.brightnessSlider = document.getElementById("brightness")
            this.contrastSlider = document.getElementById("contrast")
            this.transparentSlider = document.getElementById("transparent")

            if (this.brightnessSlider === null) {
                return hs.wrong("Can't find a brightness slider! There is should be an input tag with #brightness id.")
            }

            if (!this.brightnessSlider.hasAttribute("min") ||
                !this.brightnessSlider.hasAttribute("max") ||
                !this.brightnessSlider.hasAttribute("step")) {
                return hs.wrong("Looks like your brightness slider doesn't have one of the following attributes:" +
                    " 'min', 'max' or 'step'")
            }

            if (this.contrastSlider === null) {
                return hs.wrong("Can't find a contrast slider! There is should be an input tag with #contrast id.")
            }

            if (!this.contrastSlider.hasAttribute("min") ||
                !this.contrastSlider.hasAttribute("max") ||
                !this.contrastSlider.hasAttribute("step")) {
                return hs.wrong("Looks like your brightness slider doesn't have one of the following attributes:" +
                    " 'min', 'max' or 'step'")
            }

            if (this.transparentSlider === null) {
                return hs.wrong("Can't find a transparent slider! There is should be an input tag with #transparent id.")
            }

            if (!this.transparentSlider.hasAttribute("min") ||
                !this.transparentSlider.hasAttribute("max") ||
                !this.transparentSlider.hasAttribute("step")) {
                return hs.wrong("Looks like your brightness slider doesn't have one of the following attributes:" +
                    " 'min', 'max' or 'step'")
            }

            return hs.correct()
        }),
        onPage(page, () => {

            const brightnessMinValue = parseInt(this.brightnessSlider.getAttribute("min"));
            const brightnessMaxValue = parseInt(this.brightnessSlider.getAttribute("max"));
            const brightnessStepValue = parseInt(this.brightnessSlider.getAttribute("step"));

            if (brightnessMinValue !== -255 || brightnessMaxValue !== 255 || brightnessStepValue !== 1) {
                return hs.wrong("Brightness slider should have the following attribute values: " +
                    "min=-255, max=255, step=1")
            }

            const contrastMinValue = parseInt(this.contrastSlider.getAttribute("min"));
            const contrastMaxValue = parseInt(this.contrastSlider.getAttribute("max"));
            const contrastStepValue = parseInt(this.contrastSlider.getAttribute("step"));

            if (contrastMinValue !== -128 || contrastMaxValue !== 128 || contrastStepValue !== 1) {
                return hs.wrong("Contrast slider should have the following attribute values: " +
                    "min=-128, max=128, step=1")
            }

            const transparentMinValue = parseInt(this.transparentSlider.getAttribute("min"));
            const transparentMaxValue = parseInt(this.transparentSlider.getAttribute("max"));
            const transparentStepValue = parseFloat(this.transparentSlider.getAttribute("step"));

            if (transparentMinValue !== 0 || transparentMaxValue !== 1 || transparentStepValue !== 0.1) {
                return hs.wrong("Transparent slider should have the following attribute values: " +
                    "min=0, max=1, step=0.1")
            }

            const brightnessDefaultValue = parseInt(this.brightnessSlider.value)
            const contrastDefaultValue = parseInt(this.contrastSlider.value)
            const transparentDefaultValue = parseInt(this.transparentSlider.value)

            if (brightnessDefaultValue !== 0) {
                return hs.wrong("The default value of the brightness slider should be equal to 0!")
            }

            if (contrastDefaultValue !== 0) {
                return hs.wrong("The default value of the contrast slider should be equal to 0!")
            }

            if (transparentDefaultValue !== 1) {
                return hs.wrong("The default value of the transparent slider should be equal to 1!")
            }

            return hs.correct()
        }),
        async () => {
            const uploadButton = await page.$("input[type='file']#file-input");
            await uploadButton.uploadFile(initImage);
            await uploadButton.evaluate(upload => upload.dispatchEvent(new Event('change', {bubbles: true})));
            await sleep(500)

            const userPixels = await page.evaluate(() => {
                return this.getPixels()
            });

            const {data} = await pixels(initImage)

            const compareResult = comparePixels(userPixels, data,
                "After downloading an image into canvas it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            return hs.correct()
        },

        // testBrightness 87
        // testContrast 69
        // testTransparent 0.5

        async () => {
            let userPixels = await page.evaluate(() => {
                this.brightnessSlider.value = 87;
                this.brightnessSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            let realPixels = await pixels(brightnessTestImage)

            let compareResult = comparePixels(userPixels, realPixels.data,
                "After increasing brightness of the image it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.brightnessSlider.value = 0;
                this.brightnessSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(initImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After decreasing brightness of the image to the default value it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.contrastSlider.value = 69;
                this.contrastSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(contrastTestImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After increasing contrast of the image it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.contrastSlider.value = 0;
                this.contrastSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(initImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After decreasing contrast of the image to the default value it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.transparentSlider.value = 0.5;
                this.transparentSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(transparentTestImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After decreasing transparent of the image it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.transparentSlider.value = 1;
                this.transparentSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(initImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After increasing transparent of the image to the default value it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            userPixels = await page.evaluate(() => {
                this.brightnessSlider.value = 92;
                this.brightnessSlider.dispatchEvent(new Event("change"))

                this.contrastSlider.value = 128;
                this.contrastSlider.dispatchEvent(new Event("change"))

                this.transparentSlider.value = 0.8;
                this.transparentSlider.dispatchEvent(new Event("change"))
                return this.getPixels()
            });

            realPixels = await pixels(multipleFilterTestImage)

            compareResult = comparePixels(userPixels, realPixels.data,
                "After applying multiple filters to the image it has wrong pixel values!");
            if (compareResult) {
                return compareResult
            }

            return hs.correct()
        });

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
