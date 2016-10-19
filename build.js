"use strict";
var fsp = require('path');
var fs = require('fs');

var target = 'lib';
var verbose = false;

require('streamline').register();

var transformJs = require('streamline/lib/transformSync').transformFileSync;

function fixPath(path) {
	path = path.replace(/\\lib\\/g, '\\');
	return path.replace(/\/lib\//g, '/');
}

function mkdirp(path) {
	path = fixPath(path);
	if (fs.existsSync(path)) return;
	mkdirp(fsp.join(path, '..'));
	fs.mkdirSync(path);
}

function writeFile(path, text) {
	if (verbose) console.log('creating ' + path);
	fs.writeFileSync(path, text, 'utf8');
}

function compileFile(fname) {
	var srcPath = fsp.join(__dirname, fname);
	var dstPath = fsp.join(__dirname, target, fname);
	dstPath = fixPath(dstPath);
	var source = fs.readFileSync(srcPath, 'utf8');
	var transformed = {};
	if (/\.json$/.test(srcPath)) {
		transformed.code = source;
	} else {
		transformed = transformJs(srcPath, {sourceMaps:true, force:true});
		dstPath = dstPath.replace(/\.[^\.]+$/, '.js');
	}
	// do not compile js files, only maps are required for coverage
	//if (transformed.code) writeFile(dstPath, transformed.code);
	// maps are invalid because of istanbul instrumentation
	if (transformed.map) {
		//transformed.map.sourceRoot = '../src/';
		writeFile(dstPath.replace(/\.[^\.]+$/, '.js.map'), JSON.stringify(transformed.map));
	}
}

function compileDir(dir, deep) {
	fs.readdirSync(fsp.join(__dirname, dir)).forEach(function(sub) {
		var fname = fsp.join(dir, sub);
		if (fs.lstatSync(fsp.join(__dirname, fname)).isDirectory()) {
			compileDir(fname);
		} else if (/\.(ts|js|_js|json)$/.test(sub) && !(/\.d\.ts$/.test(sub))){
			if (deep !== 0) mkdirp(fsp.join(__dirname, target, dir));
			compileFile(fname);
		}
	})
}
var targetFull = fsp.join(__dirname, target);
mkdirp(fsp.join(targetFull));
compileDir('lib', 0);

process.exit(0);