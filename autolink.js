var fs = require('fs');
var fileName = './_posts/2016-02-29-fex-weekly-29.md';
var content = fs.readFileSync(fileName).toString();
content = content.replace(/([^\(])\n?((https?|ftp|mms):\/\/([A-z0-9]+[_\-]?[A-z0-9]+\.)*[A-z0-9]+\-?[A-z0-9]+\.[A-z]{2,}(\/.*)*\/?)/img, function (m, $1, $2) {
    return $1 + '\r\n[' + $2 + '](' + $2 + ')\r\n';
});
fs.writeFileSync(fileName, content);
