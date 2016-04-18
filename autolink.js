var fs = require('fs');
var fileName = process.argv[2];
var content = fs.readFileSync(fileName).toString();
content = content.replace(/^(\*\*.*\*\*)$/img, '$1  ');
content = content.replace(/([^\(])((https?|ftp|mms):\/\/([A-z0-9]+[_\-]?[A-z0-9]+\.)*[A-z0-9]+\-?[A-z0-9]+\.[A-z]{2,}(\/.*)*\/?)/img, function (m, $1, $2) {
    return $1 + $2 + '  ';
});
fs.writeFileSync(fileName, content);
