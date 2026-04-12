const fs = require('fs');
const acorn = require('acorn');
const code = fs.readFileSync('js/visualizer.js', 'utf8');
try {
    acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    console.log("Acorn perfectly verified that the JS file is syntactically sound locally.");
} catch(e) {
    console.log("ACORN CAUGHT IT:", e.message);
}
