const { Jimp } = require('jimp');
const fs = require('fs');

async function processImage() {
  try {
    const image = await Jimp.read('public/icons/logo.jpg');
    
    // Iterate over all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is white or very close to white, make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // Alpha channel
      }
    });

    await image.write('public/icons/logo-transparent.png');
    console.log('Background removed and saved as logo-transparent.png');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

processImage();