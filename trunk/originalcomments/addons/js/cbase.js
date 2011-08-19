/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/

// Helper function to output debug statements
function CBase() {
	this.m_bDebug = true;
	this.m_sNotImpl = "Not Impl";
};

//	platform
CBase.prototype.getPlatform = function () {
	this.notimpl("CBase.prototype.getPlatform");
}

//	alert
CBase.prototype.alert = function (msg) {
	window.alert(msg);
}

CBase.prototype.notimpl = function (what) {
	this.alert(what + " : " + this.m_sNotImpl);
	throw this.m_sNotImpl;
}

// Helper function to output debug statements
CBase.prototype.debug = function (msg,forcedebug) {
	this.notimpl("CBase.prototype.debug");
};

//	sendmessage
CBase.prototype.sendmessage = function (actionname, params_in, callback) {
	var params = new Object();
	params.action = actionname;
	params.value = params_in;

	this.sendmessage_impl(params, callback);
}

CBase.prototype.sendmessagetab = function (tabguid, actionname, params_in, callback) {
	var params = new Object();
	params.action = actionname;
	params.value = params_in;

	this.sendmessagetab_impl(tabguid, params, callback);
}

CBase.prototype.sendmessage_impl = function (params, callback) {
	this.notimpl("CBase.prototype.sendmessage_impl");
}

CBase.prototype.sendmessagetab_impl = function (tabguid, params, callback) {
	this.notimpl("CBase.prototype.sendmessagetab_impl");
}

//	receive message
CBase.prototype.onreceivemessage = function (callback) {
	this.notimpl("CBase.prototype.onreceivemessage");
}

CBase.prototype.onreceivemessagetab = function (tabguid,callback) {
	this.notimpl("CBase.prototype.onreceivemessagetab");
}

CBase.prototype.onreceivemessage_u = function () {
	this.notimpl("CBase.prototype.onreceivemessage_u");
}

CBase.prototype.onreceivemessagetab_u = function (tabguid) {
	this.notimpl("CBase.prototype.onreceivemessagetab_u");
}

//	options
CBase.prototype.getoption = function (sName, sDefaultValue) {
	try {
		var s = this.getoption_impl(sName);
		if (!ctools.isempty(s)) {
			var o = this.json_parse(s);
			if (!ctools.isempty(o)) {
				return ctools.adjustvalue(o.value, sDefaultValue);
			}
		}
	}
	catch (e) { }
	//default
	return ctools.adjustvalue(null, sDefaultValue);
}
CBase.prototype.setoption = function (sName, sValue) {
	try {
		var o = {};
		o.value = sValue;
		this.setoption_impl(sName, this.json_stringify(o));
	}
	catch (e) {
		this.alert(e.message);
		throw e;
	}
}
CBase.prototype.removeoption = function (sName) {
	this.removeoption_impl(sName);
}

CBase.prototype.getoption_impl = function (sName) {
	this.notimpl("CBase.prototype.getOption");
}
CBase.prototype.setoption_impl = function (sName, sValue) {
	this.notimpl("CBase.prototype.setOption");
}
CBase.prototype.removeoption_impl = function (sName) {
	this.notimpl("CBase.prototype.removeOption");
}

//	json
CBase.prototype.json_stringify = function (myObject) {
	this.notimpl("CBase.prototype.json_stringify");
}
CBase.prototype.json_parse = function (myJSONtext) {
	//this.notimpl("CBase.prototype.json_parse");
	//default implementation
	return json_parse(myJSONtext);
}

//	language
CBase.prototype.getlanguagevalue = function (sName) {
	this.notimpl("CBase.prototype.getlanguagevalue");
}

//	xmlhttprequest
CBase.prototype.createXMLHttpRequest = function () {
	this.notimpl("CBase.prototype.createXMLHttpRequest");
}

//	url
CBase.prototype.getURL = function (sURL) {
	this.notimpl("CBase.prototype.getURL");
}

//	newTab
CBase.prototype.newTab = function (url, active) {
	this.notimpl("CBase.prototype.newTab");
}

//	notifyFollowCommentsChanged
CBase.prototype.notifyFollowCommentsChanged = function (nCount) {
	this.notimpl("CBase.prototype.notifyFollowCommentsChanged");
}

CBase.prototype.getCookie = function (url, name, callback) {
	this.notimpl("CBase.prototype.getCookie");
}

CBase.prototype.setCookie = function (url, name, value) {
	this.notimpl("CBase.prototype.getCookie");
}

//
var cbase = new CBase();




////////////////////////////////////////////////////////////////////////////////

/*
http://www.JSON.org/json_parse.js
2009-05-31

* modified by Kevin heart@pimshell.com
	2010-11-28

Public Domain.

NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

This file creates a json_parse function.

json_parse(text, reviver)
This method parses a JSON text to produce an object or array.
It can throw a SyntaxError exception.

The optional reviver parameter is a function that can filter and
transform the results. It receives each of the keys and values,
and its return value is used instead of the original value.
If it returns what it received, then the structure is not modified.
If it returns undefined then the member is deleted.

Example:

// Parse the text. Values that look like ISO date strings will
// be converted to Date objects.

myData = json_parse(text, function (key, value) {
var a;
if (typeof value === 'string') {
a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
if (a) {
return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
+a[5], +a[6]));
}
}
return value;
});

This is a reference implementation. You are free to copy, modify, or
redistribute.

This code should be minified before deployment.
See http://javascript.crockford.com/jsmin.html

USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
NOT CONTROL.
*/

/*members "", "\"", "\/", "\\", at, b, call, charAt, f, fromCharCode,
hasOwnProperty, message, n, name, push, r, t, text
*/

var json_parse = (function () {

	// This is a function that can parse a JSON text, producing a JavaScript
	// data structure. It is a simple, recursive descent parser. It does not use
	// eval or regular expressions, so it can be used as a model for implementing
	// a JSON parser in other languages.

	// We are defining the function inside of another function to avoid creating
	// global variables.

	var at,     // The index of the current character
        ch,     // The current character
        escapee = {
        	//2010.11.28 '
        	'\'': '\'',
        	'"': '"',
        	'\\': '\\',
        	'/': '/',
        	b: '\b',
        	f: '\f',
        	n: '\n',
        	r: '\r',
        	t: '\t'
        },
        text,

        error = function (m) {

        	// Call error when something is wrong.

        	throw {
        		name: 'SyntaxError',
        		message: m,
        		at: at,
        		text: text
        	};
        },

        next = function (c) {

        	// If a c parameter is provided, verify that it matches the current character.

        	if (c && c !== ch) {
        		error("Expected '" + c + "' instead of '" + ch + "'");
        	}

        	// Get the next character. When there are no more characters,
        	// return the empty string.

        	ch = text.charAt(at);
        	at += 1;
        	return ch;
        },

		prev = function () {
			at -= 1;
			ch = text.charAt(at - 1);
			return ch;
		},

	number = function () {

		// Parse a number value.

		var number,
                string = '';

		if (ch === '-') {
			string = '-';
			next('-');
		}
		while (ch >= '0' && ch <= '9') {
			string += ch;
			next();
		}
		if (ch === '.') {
			string += '.';
			while (next() && ch >= '0' && ch <= '9') {
				string += ch;
			}
		}
		if (ch === 'e' || ch === 'E') {
			string += ch;
			next();
			if (ch === '-' || ch === '+') {
				string += ch;
				next();
			}
			while (ch >= '0' && ch <= '9') {
				string += ch;
				next();
			}
		}
		number = +string;
		if (isNaN(number)) {
			error("Bad number");
		} else {
			return number;
		}
	},

        string = function (checkQuot_in) {

        	// Parse a string value.

        	var hex,
                i,
                string = '',
                uffff;

        	// When parsing for string values, we must look for " and \ characters.
        	//2010.11.28 support apos
        	var token = (ch === '"' || ch === '\'') ? ch : '';

        	//2010.11.27 support key:"string"
        	var hasToken = (ch === token);
        	var checkQuot = (checkQuot || hasToken);

        	var bFirstCheck = true;
        	if (!checkQuot || ch === token) {
        		while ((bFirstCheck && !checkQuot) || next()) {
        			bFirstCheck = false;
        			if (checkQuot && ch === token) {
        				next();
        				return string;
        			}
        			else if (!checkQuot && (ch === ':' || isWhite(ch))) {
        				return string;
        			}
        			else if (ch === '\\') {
        				next();
        				if (ch === 'u') {
        					uffff = 0;
        					for (i = 0; i < 4; i += 1) {
        						hex = parseInt(next(), 16);
        						if (!isFinite(hex)) {
        							break;
        						}
        						uffff = uffff * 16 + hex;
        					}
        					string += String.fromCharCode(uffff);
        				}
        				else if (ch === 'x') {
        					uffff = 0;
        					for (i = 0; i < 2; i += 1) {
        						hex = parseInt(next(), 16);
        						if (!isFinite(hex)) {
        							break;
        						}
        						uffff = uffff * 16 + hex;
        					}
        					string += String.fromCharCode(uffff);
        				}
        				else if (typeof ch === 'string' && ch.charCodeAt(0) >= 48 && ch.charCodeAt(0) <= 57) {
        					uffff = 0;
        					for (i = 0; i < 3; i++) {
        						hex = parseInt(ch, 8);
        						if (!isFinite(hex)) {
        							break;
        						}
        						uffff = uffff * 8 + hex;

        						if (i < 2) {
        							next();
        							if (typeof ch === 'string' && ch.charCodeAt(0) >= 48 && ch.charCodeAt(0) <= 57) {
        								//continue
        							}
        							else {
        								//break
        								prev();
        								break;
        							}
        						}
        					}

        					string += String.fromCharCode(uffff);
        				}
        				else if (typeof escapee[ch] === 'string') {
        					string += escapee[ch];
        				} else {
        					break;
        				}
        			} else {
        				string += ch;
        			}
        		}
        	}
        	error("Bad string");
        },

		isWhite = function (ch) {
			return ch && ch <= ' ';
		},

	white = function () {

		// Skip whitespace.

		while (ch && ch <= ' ') {
			next();
		}
	},

        word = function () {

        	// true, false, or null.

        	switch (ch) {
        		case 't':
        			next('t');
        			next('r');
        			next('u');
        			next('e');
        			return true;
        		case 'f':
        			next('f');
        			next('a');
        			next('l');
        			next('s');
        			next('e');
        			return false;
        		case 'n':
        			next('n');
        			next('u');
        			next('l');
        			next('l');
        			return null;
        	}
        	error("Unexpected '" + ch + "'");
        },

        value,  // Place holder for the value function.

        array = function () {

        	// Parse an array value.

        	var array = [];

        	if (ch === '[') {
        		next('[');
        		white();
        		if (ch === ']') {
        			next(']');
        			return array;   // empty array
        		}
        		while (ch) {
        			array.push(value());
        			white();
        			if (ch === ']') {
        				next(']');
        				return array;
        			}
        			next(',');
        			white();
        		}
        	}
        	error("Bad array");
        },

        object = function () {

        	// Parse an object value.

        	var key,
                object = {};

        	if (ch === '{') {
        		next('{');
        		white();
        		if (ch === '}') {
        			next('}');
        			return object;   // empty object
        		}
        		while (ch) {
        			key = string(false);
        			white();
        			next(':');
        			//2010.11.28 not check
        			//if (Object.hasOwnProperty.call(object, key)) {
        			//	error('Duplicate key "' + key + '"');
        			//}
        			object[key] = value();
        			white();
        			if (ch === '}') {
        				next('}');
        				return object;
        			}
        			next(',');
        			white();
        		}
        	}
        	error("Bad object");
        };

	value = function () {

		// Parse a JSON value. It could be an object, an array, a string, a number,
		// or a word.

		white();
		switch (ch) {
			case '{':
				return object();
			case '[':
				return array();
			case '"':
				return string(true);
				//2010.11.28
			case '\'':
				return string(true);
			case '-':
				return number();
			default:
				return ch >= '0' && ch <= '9' ? number() : word();
		}
	};

	// Return the json_parse function. It will have access to all of the above
	// functions and variables.

	return function (source, reviver) {
		var result;

		//2011.08.06 check source first
		if (source == null || source == "")
			return null;

		//
		text = source;
		at = 0;
		ch = ' ';
		result = value();
		white();
		if (ch) {
			error("Syntax error");
		}

		// If there is a reviver function, we recursively walk the new structure,
		// passing each name/value pair to the reviver function for possible
		// transformation, starting with a temporary root object that holds the result
		// in an empty key. If there is not a reviver function, we simply return the
		// result.

		return typeof reviver === 'function' ? (function walk(holder, key) {
			var k, v, value = holder[key];
			if (value && typeof value === 'object') {
				for (k in value) {
					if (Object.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) {
							value[k] = v;
						} else {
							delete value[k];
						}
					}
				}
			}
			return reviver.call(holder, key, value);
		} ({ '': result }, '')) : result;
	};
} ());


