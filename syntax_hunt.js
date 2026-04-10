// If acorn parses the current app.js perfectly, why does the browser say:
// app.js:1174 Uncaught SyntaxError: Unexpected token '.'

// Let's print out what is exactly on line 1174!
const fs = require('fs');
const lines = fs.readFileSync('js/app.js', 'utf8').split('\n');
console.log("1174:", lines[1173]);
