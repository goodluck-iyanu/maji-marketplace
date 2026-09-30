const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src/app/(dashboard)/dashboard/products/new');
const files = fs.readdirSync(dir);

for (const file of files) {
    if (!file.endsWith('-builder.tsx')) continue;
    if (['fashion-builder.tsx', 'digital-builder.tsx', 'ebooks-builder.tsx', 'templates-builder.tsx'].includes(file)) continue;

    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    content = content.replace(/const handleBack = \(\) => setCurrentStep\(c => Math\.max\(c - 1, 0\)\)/g, 'const handleBack = () => setCurrentStep(c => { if (c === 6 && !hasOptions) return 4; return Math.max(c - 1, 0) })');
    content = content.replace(/setCurrentStep\(STEPS\.length - 1\)/g, 'setCurrentStep(6)');
    content = content.replace(/onClick=\{handleNext\} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Review Product<\/button>/g, 'onClick={handleNext} className="bg-black text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50">Next Step</button>');

    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Done');
