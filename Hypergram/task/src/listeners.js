let originalPixels;
const DEFAULT_BRIGHTNESS = 0;
const DEFAULT_CONTRAST = 0;
const DEFAULT_TRANSPARENT = 1;
const RANGE_EVENT_TYPE = 'change';

let brightness;
let contrast;
let transparent;

const getCanvas = () => document.getElementById('canvas');
const getCtx = () => getCanvas().getContext('2d');

const drawImageOnload = image => (_) => {
    const canvas = getCanvas();
    const ctx = getCtx();
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    originalPixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

const fileInput = document.getElementById('file-input');
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
});

const processPixels = (initialPixels, colorFun, alphaFun) => {
    const canvas = getCanvas();
    const ctx = getCtx();
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
    ctx.putImageData(imageData, 0, 0);
};


const applyAdjustments = (Brightness, Contrast, Transparent) => {
    if (originalPixels !== undefined) {
        const Truncate = (number) => number < 0 ? 0 : (number > 255 ? 255 : number);
        const Factor = 259 * (255 + Contrast) / (255 * (259 - Contrast));
        const adjustContrast = (color) => (Factor * (color - 128) + 128);
        const adjustBrightness = (color) => (color + Brightness);
        const adjustColor = (color) => Truncate(adjustBrightness(adjustContrast(color)));
        const adjustTransparent = (alpha) => alpha * Transparent;
        processPixels(originalPixels, adjustColor, adjustTransparent);
    }
};

const applySavedAdjustments = () => applyAdjustments(brightness, contrast, transparent);

const brightnessRange = document.getElementById('brightness');
brightnessRange.addEventListener(RANGE_EVENT_TYPE, (ev) => {
    brightness = parseInt(ev.target.value);
    applySavedAdjustments();
});

const contrastRange = document.getElementById('contrast');
contrastRange.addEventListener(RANGE_EVENT_TYPE, (ev) => {
    contrast = parseInt(ev.target.value);
    applySavedAdjustments();
});

const transparentRange = document.getElementById('transparent');
transparentRange.addEventListener(RANGE_EVENT_TYPE, (ev) => {
    transparent = parseFloat(ev.target.value);
    applySavedAdjustments();
});

const resetAdjustments = () => {
    brightnessRange.value = DEFAULT_BRIGHTNESS;
    brightnessRange.dispatchEvent(new Event(RANGE_EVENT_TYPE));
    contrastRange.value = DEFAULT_CONTRAST;
    contrastRange.dispatchEvent(new Event(RANGE_EVENT_TYPE));
    transparentRange.value = DEFAULT_TRANSPARENT;
    transparentRange.dispatchEvent(new Event(RANGE_EVENT_TYPE));
};

getCanvas().addEventListener('mousedown', (_ev) => applyAdjustments(DEFAULT_BRIGHTNESS, DEFAULT_CONTRAST, DEFAULT_TRANSPARENT));

getCanvas().addEventListener('mouseup', (_ev) => applyAdjustments(brightness, contrast, transparent));

const resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', (_ev) => resetAdjustments());

const caveButton = document.getElementById('save-button');
caveButton.addEventListener('click', (_ev) => {
    const imageData = getCanvas().toDataURL();
    const tmpLink = document.createElement('a');
    tmpLink.download = 'result.png';
    tmpLink.href = imageData;

    document.body.appendChild( tmpLink );
    tmpLink.click();
    document.body.removeChild( tmpLink );
});
