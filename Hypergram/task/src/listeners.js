let fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', (ev) => {
    if (ev.target.files) {
        let file = ev.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = (e) => {
            let image = new Image();
            image.src = e.target.result;
            image.onload = (ev) => {
                let canvas = document.getElementById("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                let ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
            }
        }
    }
})