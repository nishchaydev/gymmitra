const fs = require('fs');
const path = require('path');

const root = process.cwd();

function move(srcRel, destRel) {
    const src = path.join(root, srcRel);
    const dest = path.join(root, destRel);

    if (fs.existsSync(src)) {
        const destParent = path.dirname(dest);
        if (!fs.existsSync(destParent)) {
            fs.mkdirSync(destParent, { recursive: true });
        }

        try {
            // cpSync is more stable than rename for nested dirs across some environments
            fs.cpSync(src, dest, { recursive: true });
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`Moved ${srcRel} to ${destRel}`);
        } catch (e) {
            console.error(`Error moving ${srcRel}: ${e.message}`);
        }
    } else {
        console.log(`Source not found: ${srcRel}`);
    }
}

const routes = [
    ['app/dashboard', 'app/(dashboard)/[slug]/dashboard'],
    ['app/members', 'app/(dashboard)/[slug]/members'],
    ['app/invoices', 'app/(dashboard)/[slug]/invoices'],
    ['app/attendance', 'app/(dashboard)/[slug]/attendance'],
    ['app/products', 'app/(dashboard)/[slug]/products'],
    ['app/settings', 'app/(dashboard)/[slug]/settings'],
    ['app/invoice/[token]', 'app/[slug]/invoice/[token]']
];

routes.forEach(([s, d]) => move(s, d));
