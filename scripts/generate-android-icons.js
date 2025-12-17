const fs = require('fs');
const path = require('path');

// Android icon sizes required
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const roundIconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  try {
    // Try to use @capacitor/assets if available
    const { CapacitorAssets } = require('@capacitor/assets');
    
    const assets = new CapacitorAssets({
      iconBackgroundColor: '#000000',
      iconBackgroundColorDark: '#000000',
      splashBackgroundColor: '#000000',
      splashBackgroundColorDark: '#000000',
      logoSplashScale: 1.0,
    });

    const iconPath = path.join(__dirname, '../client/public/assets/logo.svg');
    
    if (!fs.existsSync(iconPath)) {
      console.error(`Logo file not found: ${iconPath}`);
      process.exit(1);
    }

    console.log('Generating Android icons from logo.svg...');
    
    // Generate icons for Android
    await assets.generateIcons({
      iconPath: iconPath,
      platforms: {
        android: {
          iconBackgroundColor: '#000000',
          adaptiveIconBackgroundColor: '#000000',
          adaptiveIconForegroundColor: '#000000',
        },
      },
    });

    console.log('✅ Android icons generated successfully!');
    console.log('Icons are located in: android/app/src/main/res/mipmap-*/');
    
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nFalling back to manual conversion...');
    
    // Fallback: Use sharp if available
    try {
      const sharp = require('sharp');
      const iconPath = path.join(__dirname, '../client/public/assets/logo.svg');
      const androidResPath = path.join(__dirname, '../android/app/src/main/res');
      
      if (!fs.existsSync(iconPath)) {
        console.error(`Logo file not found: ${iconPath}`);
        process.exit(1);
      }

      console.log('Using sharp to generate icons...');
      
      // Generate regular icons
      for (const [folder, size] of Object.entries(iconSizes)) {
        const outputDir = path.join(androidResPath, folder);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        await sharp(iconPath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
          .png()
          .toFile(path.join(outputDir, 'ic_launcher.png'));
        
        await sharp(iconPath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
          .png()
          .toFile(path.join(outputDir, 'ic_launcher_round.png'));
        
        await sharp(iconPath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
          .png()
          .toFile(path.join(outputDir, 'ic_launcher_foreground.png'));
        
        console.log(`✅ Generated ${folder} icons (${size}x${size})`);
      }
      
      console.log('\n✅ All Android icons generated successfully!');
      
    } catch (sharpError) {
      console.error('Sharp not available. Please install sharp: npm install --save-dev sharp');
      console.error('Or use an online tool to convert logo.svg to PNGs in these sizes:');
      console.log('Required sizes:', Object.values(iconSizes).join(', '));
      process.exit(1);
    }
  }
}

generateIcons();

