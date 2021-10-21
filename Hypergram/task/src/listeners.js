let originalPixels;
let brightness = 0;
let contrast = 0;
let transparent = 1;

const getCanvas = () => document.getElementById("canvas");
const getCtx = () => getCanvas().getContext('2d');

const drawImageOnload = image => (_) => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    originalPixels = getPixels();
};

const fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', (ev) => {
    if (ev.target.files) {
        const file = ev.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) => {
            const image = new Image();
            image.src = e.target.result;
            image.onload = drawImageOnload(image);
            resetAdjustments();
        }
    }
})

const getPixels = () => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data;
}

const processPixels = (initialPixels, colorFun, alphaFun) => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    pixels.set(initialPixels);

    for (let redIndex = 0; redIndex + 3 < pixels.length; redIndex += 4) {
        let RED = pixels[redIndex];
        let GREEN = pixels[redIndex + 1];
        let BLUE = pixels[redIndex + 2];
        let ALPHA = pixels[redIndex + 3];

        pixels[redIndex] = colorFun(RED);
        pixels[redIndex + 1] = colorFun(GREEN);
        pixels[redIndex + 2] = colorFun(BLUE);
        pixels[redIndex + 3] = alphaFun(ALPHA);
    }
    getCtx().putImageData(imageData, 0, 0);
};


const applyAdjustments = (Brightness, Contrast, Transparent) => {
    if (originalPixels !== undefined){
        console.log(`Brightness:\t ${Brightness}`);
        console.log(`Contrast:\t ${Contrast}`);
        console.log(`Transparent:\t ${Transparent}`);
        const Truncate = (number) => number < 0 ? 0 : (number > 255 ? 255 : number);
        const Factor = 259 * (255 + Contrast) / (255 * (259 - Contrast));
        const adjustContrast = (color) => (Factor * (color - 128) + 128);
        const adjustBrightness = (color) => (color + Brightness);
        const adjustColor = (color) => Truncate(adjustBrightness(adjustContrast(color)));
        const adjustTransparent = (alpha) => alpha * Transparent;
        processPixels(originalPixels, adjustColor, adjustTransparent);
    }
}

const applySavedAdjustments = () => applyAdjustments(brightness, contrast, transparent);

const brightnessRange = document.getElementById("brightness");
brightnessRange.addEventListener('change', (ev) => {
    brightness = parseInt(ev.target.value);
    applySavedAdjustments();
})

const contrastRange = document.getElementById("contrast");
contrastRange.addEventListener('change', (ev) => {
    contrast = parseInt(ev.target.value);
    applySavedAdjustments();
})

const transparentRange = document.getElementById("transparent");
transparentRange.addEventListener('change', (ev) => {
    transparent = parseFloat(ev.target.value);
    applySavedAdjustments();
})

const resetAdjustments = () => {
    brightnessRange.value = 0;
    brightnessRange.dispatchEvent(new Event("change"));
    contrastRange.value = 0;
    contrastRange.dispatchEvent(new Event("change"));
    transparentRange.value = 1;
    transparentRange.dispatchEvent(new Event("change"));
}
