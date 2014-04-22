/*!
 * blog text formatter
 * @rank
 * @Date: 2014-04-03
 */

'use strict';

var fs   = require('fs'),
	path = require('path');

var fmt  = module.exports = {};


fmt.extFilter = function(fp) {
	return (path.extname(fp) === '.md' ||
			fs.statSync(fp).isDirectory());
}

fmt.formatter = function(all, p1, p2) {
	return p1 +' '+ p2;
}

fmt.format =  function(root) {

	if (!fs.existsSync(root)) {
		console.log('[Error] "' +root+ '" is not exists.');
		return;
	}
	var stat = fs.statSync(root);

	if (stat.isFile()) {
		console.log(root +' is a [File].')
		this._format(root);

	} else if (stat.isDirectory()) {
		console.log('"' +root+ '" is a [Directory].');

		var counter = 0;
		this._walk(root, function(fp) {
			counter++;
			return fmt._format(fp);
		});
		console.log('[COUNTER] totally files counter: '+counter );

	} else {
		throw new Error(['dir stat [Error].'])
	}
},


fmt._walk = function(dir, cb) {
	
	var obj   = fmt,
		files = fs.readdirSync(dir)
				.filter(function(file) {
					return obj.extFilter.call(this, dir +'/'+ file);
				});

	files.forEach(function(path) {
		var tmp  = dir +'/'+ path,
			stat = fs.statSync(tmp);
		
		if (stat.isDirectory()) {
			console.log('[RECURSIVE] '+ tmp);
			obj._walk.call(this, tmp, cb);
		} else {
			cb && cb(tmp);
		}

	});	
}

fmt._format = function(fp) {

	var leftExp   = /([a-z0-9\+\-]+)([^\x00-\xff，「」！。、【】『』《》？：（）]+)/ig, //匹配英文+非ASCII码/标点情况
		rightExp  = /([^\x00-\xff，「」！。、【】『』《》？：（）]+)([a-z0-9\+\-]+)/ig,  //匹配非ASCII码/标点+英文情况
		stream    = fs.readFileSync(fp).toString(), 
		newstream = '';

	console.log('[SCAN] ' +fp);

	if (leftExp.test(stream) || rightExp.test(stream)) {
		console.log(fp +' has been formatted.');

		newstream = stream.replace(leftExp, this.formatter)
					.replace(rightExp, this.formatter);

		fs.writeFileSync(fp, newstream);
	}
}



var args = process.argv.splice(2);
args[0] && fmt.format(args[0]);

