/*!
 * blog text formatter
 * @rank
 * @Date: 2014-04-03
 */

'use strict';

var fs   = require('fs'),
	path = require('path');

var fmt  = module.exports = {};


fmt.dirRoot = null;

/**
 * extFilter
 * filter file with the extension name
 * if result is TRUE, that will be formatted.
 * @return {Boolean}
 */
fmt.extFilter = function(fp) {
	return (path.extname(fp).toLowerCase() === '.md' ||
			fs.statSync(fp).isDirectory());
}

/**
 * set dir root
 * @return {String}
 */
fmt.setDirRoot = function(dir) {
	this.dirRoot = path.dirname(root);
	if (this.dirRoot === '.') this.dirRoot = '';
	return this.dirRoot;
}

/** 
 * this is formatter rules object
 * the methods will be invoked by format function
 */
fmt.rules = {

	mixspace: function(stream, fp) {
			//匹配英文+非ASCII码/标点情况
		var leftExp   = /([a-z0-9\+\-]+)([^\x00-\xff，「」！。、【】『』《》？：（）]+)/ig, 
			rightExp  = /([^\x00-\xff，「」！。、【】『』《》？：（）]+)([a-z0-9\+\-]+)/ig,
			newstream = '',
			formatter = function(all, p1, p2) {
				return p1 +' '+ p2;
			};

		if (leftExp.test(stream) || rightExp.test(stream)) {
			console.log(fp +' has been mixspace.');

			newstream = stream.replace(leftExp, formatter)
						.replace(rightExp, formatter);

		}
		return newstream;
	},

	quotes: function(stream, fp) {
		if (!/“|”/.test(stream)) {
			return stream;
		}
		console.log(fp +' has been replace “”.');
		return stream.replace(/“/g, '「').replace(/”/g, '」');
	}
}


/** 
 * check the dest available
 * @root {String} the destination dir
 * @return {Boolean} 
 */
fmt._chkdest = function(dest) {

	if (!fs.existsSync(dest)) {
		console.log('[ERROR] dest "' +dest+ '" is not exists.');
		return false;
	}
	if (!fs.statSync(dest).isDirectory()) {
		console.log('[ERROR] dest "' +dest+ '" is not a dir.');
		return false;
	}

	return true;
}

/** 
 * the formatter main function
 * @root {String} the root dirname or filename
 * @dest {String} optional. the output directory
 * @return {void}
 */
fmt.format =  function(root, dest) {

	if (!fs.existsSync(root)) {
		console.log('[Error] "' +root+ '" is not exists.');
		return;
	}
	if (dest && !this._chkdest(dest)) return;

	console.log('[DIRROOT] '+ this.setDirRoot(root));
	var stat = fs.statSync(root);

	if (stat.isFile()) {

		console.log(root +' is a [File].');
		this.applyRules(root, dest);

	} else if (stat.isDirectory()) {

		console.log('"' +root+ '" is a [Directory].');
		var counter = 0;

		this.walk(root, function(fp) {
			counter++;
			return fmt.applyRules(fp, dest);
		}, this.extFilter);

		console.log('[COUNTER] totally files counter: '+counter );

	} else {
		console.log('dir stat [Error].');
	}
},

/** 
 * recursive dir and execute callback when scan a file.
 * @dir    {String} the root dirname or filename
 * @cb     {Function} optional. excute callback function
 * @filter {Function} optional. filter filename
 * @return {void}
 */
fmt.walk = function(dir, cb, filter) {
	
	var obj    = fmt,
		retval = false,
		files  = fs.readdirSync(dir)
				.filter(function(filename) {
					return filter.call(this, dir +'/'+ filename);
				});

	files.forEach(function(fp) {
		var tmp  = dir +'/'+ fp,
			stat = fs.statSync(tmp);
		
		if (stat.isDirectory()) {
			console.log('[RECURSIVE] '+ tmp);
			obj.walk.call(this, tmp, cb, filter);

		} else {
			if (cb) retval = cb(tmp);
			if (!retval) process.exit(1);
		}

	});	
}

/** 
 * apply all formmater rules in fmt.rules
 * @dir    {String} file path
 * @cb     {Function} optional. destination dir
 * @return {Boolean}
 */
fmt.applyRules = function(fp, dest) {

	var newstream = '',
		dir = "";

	if (dest && fmt._chkdest(dest)) {
		dest = dest+ '/'+ fp.replace(fmt.dirRoot, '').replace(/\/\//i, '\/');
		dir  = path.dirname(dest);
		(!fs.existsSync(dir)) && fs.mkdir(dir);
	} else {
		dest = fp;
	}

	console.log('[SCAN] ' +fp);
	console.log('[DEST] ' +dest);

	newstream = fs.readFileSync(fp).toString();

	for (var method in fmt.rules) {
		newstream = fmt.rules[method].call(this, newstream, fp);
	}

	fs.writeFileSync(dest, newstream);

	return true;
}



var args = process.argv.splice(2);
if (args[0]) fmt.format(args[0], args[1]);
else console.log('No input dir/file. \nUsage: node ' +path.basename(__filename)+ ' dir/file [dest].');



