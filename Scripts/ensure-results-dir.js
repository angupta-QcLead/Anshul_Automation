const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'results');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log('Created results/ directory');
} else {
  console.log('results/ directory already exists');
}
