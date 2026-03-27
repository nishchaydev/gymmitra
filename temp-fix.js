const fs = require('fs');
let content = fs.readFileSync('app/(dashboard)/[slug]/members/actions.ts', 'utf8');
content = content.replace(/emergencyRelation: validatedData\.emergencyRelation \|\| '',\r?\n\s+\}/, "emergencyRelation: validatedData.emergencyRelation || '',\n                } as any");
fs.writeFileSync('app/(dashboard)/[slug]/members/actions.ts', content);
