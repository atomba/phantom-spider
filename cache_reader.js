var fs = require('fs');

var file = process.argv[2];

var buffer = fs.readFileSync(file);

console.log(buffer.toString('utf8'));