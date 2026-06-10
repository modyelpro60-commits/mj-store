const sharp = require("sharp");

const files = [
  "user",
  "verified",
  "helper",
  "moderator",
  "admin",
];

async function convert() {
  for (const file of files) {
    await sharp(`${file}.png`)
      .webp({ quality: 90 })
      .toFile(`${file}.webp`);

    console.log(`✓ ${file}.webp`);
  }
}

convert();