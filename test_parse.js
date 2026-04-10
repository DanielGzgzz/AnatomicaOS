const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('js/app.js', 'utf8');

try {
    acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    console.log("Acorn compiled successfully.");
} catch (e) {
    console.log(`Acorn failed: ${e.message}`);
    const lines = code.split('\n');
    let start = Math.max(0, e.loc.line - 15);
    let end = Math.min(lines.length, e.loc.line + 5);

    for (let i = start; i < end; i++) {
        let prefix = (i + 1 === e.loc.line) ? ">>> " : "    ";
        console.log(`${prefix}${i + 1}: ${lines[i]}`);
    }
}
