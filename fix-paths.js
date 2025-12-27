const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  content = content.replace(/href="\/([^"]*)"/g, 'href="./$1"');
  content = content.replace(/src="\/([^"]*)"/g, 'src="./$1"');
  
  fs.writeFileSync(indexPath, content);
  console.log('Fixed paths for GitHub Pages');
}