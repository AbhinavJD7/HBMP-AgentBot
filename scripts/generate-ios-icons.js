const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// iOS App Icon sizes required - all sizes needed for App Store submission
const iconSizes = [
  // iPhone
  { size: 20, scale: 2, filename: 'icon-20@2x.png', idiom: 'iphone' }, // 40x40
  { size: 20, scale: 3, filename: 'icon-20@3x.png', idiom: 'iphone' }, // 60x60
  { size: 29, scale: 2, filename: 'icon-29@2x.png', idiom: 'iphone' }, // 58x58
  { size: 29, scale: 3, filename: 'icon-29@3x.png', idiom: 'iphone' }, // 87x87
  { size: 40, scale: 2, filename: 'icon-40@2x.png', idiom: 'iphone' }, // 80x80
  { size: 40, scale: 3, filename: 'icon-40@3x.png', idiom: 'iphone' }, // 120x120
  { size: 60, scale: 2, filename: 'icon-60@2x.png', idiom: 'iphone' }, // 120x120 - REQUIRED
  { size: 60, scale: 3, filename: 'icon-60@3x.png', idiom: 'iphone' }, // 180x180
  
  // iPad
  { size: 20, scale: 1, filename: 'icon-20@1x.png', idiom: 'ipad' }, // 20x20
  { size: 20, scale: 2, filename: 'icon-20@2x-ipad.png', idiom: 'ipad' }, // 40x40
  { size: 29, scale: 1, filename: 'icon-29@1x.png', idiom: 'ipad' }, // 29x29
  { size: 29, scale: 2, filename: 'icon-29@2x-ipad.png', idiom: 'ipad' }, // 58x58
  { size: 40, scale: 1, filename: 'icon-40@1x.png', idiom: 'ipad' }, // 40x40
  { size: 40, scale: 2, filename: 'icon-40@2x-ipad.png', idiom: 'ipad' }, // 80x80
  { size: 76, scale: 1, filename: 'icon-76@1x.png', idiom: 'ipad' }, // 76x76
  { size: 76, scale: 2, filename: 'icon-76@2x.png', idiom: 'ipad' }, // 152x152 - REQUIRED
  { size: 83.5, scale: 2, filename: 'icon-83.5@2x.png', idiom: 'ipad' }, // 167x167 - REQUIRED for iPad Pro
  
  // App Store
  { size: 1024, scale: 1, filename: 'icon-1024.png', idiom: 'ios-marketing' }, // 1024x1024
];

async function generateIOSIcons() {
  try {
    const iconPath = path.join(__dirname, '../client/public/assets/logo.svg');
    const iosAppIconPath = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
    
    if (!fs.existsSync(iconPath)) {
      console.error(`Logo file not found: ${iconPath}`);
      process.exit(1);
    }

    if (!fs.existsSync(iosAppIconPath)) {
      fs.mkdirSync(iosAppIconPath, { recursive: true });
    }

    console.log('Generating iOS icons from logo.svg...');

    // Generate all icon sizes
    for (const icon of iconSizes) {
      const actualSize = Math.round(icon.size * icon.scale);
      const outputPath = path.join(iosAppIconPath, icon.filename);
      
      // Create icon with solid black background, no alpha channel
      await sharp(iconPath)
        .resize(actualSize, actualSize, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 1 } 
        })
        .flatten({ background: { r: 0, g: 0, b: 0 } }) // Remove alpha channel
        .png({ 
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true,
          palette: false // Ensure RGB, not RGBA
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${icon.filename} (${actualSize}x${actualSize}) for ${icon.idiom}`);
    }

    // Create Contents.json for AppIcon with proper iPhone/iPad entries
    const contentsJson = {
      images: iconSizes.map(icon => ({
        filename: icon.filename,
        idiom: icon.idiom,
        scale: icon.scale === 1 ? '1x' : `${icon.scale}x`,
        size: `${icon.size}x${icon.size}`,
      })),
      info: {
        author: 'xcode',
        version: 1,
      },
    };

    fs.writeFileSync(
      path.join(iosAppIconPath, 'Contents.json'),
      JSON.stringify(contentsJson, null, 2)
    );

    console.log('\n✅ All iOS icons generated successfully!');
    console.log(`Icons are located in: ${iosAppIconPath}`);
    
  } catch (error) {
    console.error('Error generating iOS icons:', error.message);
    process.exit(1);
  }
}

generateIOSIcons();

