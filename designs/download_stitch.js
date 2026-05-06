const fs = require('fs');
const path = require('path');
const https = require('https');

const dataFile = 'C:/Users/ASUS/.gemini/antigravity/brain/649c7a95-d745-4f13-99af-670c338b053a/.system_generated/steps/5/output.txt';
const outDir = path.join(__dirname, 'designs');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirect
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

function sanitizeName(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

async function main() {
    console.log('Reading data...');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    for (const screen of data.screens) {
        const title = sanitizeName(screen.title);
        
        console.log(`Processing: ${screen.title}`);
        
        if (screen.htmlCode && screen.htmlCode.downloadUrl) {
            const ext = screen.htmlCode.mimeType === 'text/markdown' ? '.md' : '.html';
            const htmlDest = path.join(outDir, `${title}${ext}`);
            console.log(`  Downloading code to ${title}${ext}`);
            await downloadFile(screen.htmlCode.downloadUrl, htmlDest);
        }
        
        if (screen.screenshot && screen.screenshot.downloadUrl) {
            const imgDest = path.join(outDir, `${title}.png`);
            console.log(`  Downloading screenshot to ${title}.png`);
            await downloadFile(screen.screenshot.downloadUrl, imgDest);
        }
    }
    
    console.log('All downloads completed!');
}

main().catch(console.error);
