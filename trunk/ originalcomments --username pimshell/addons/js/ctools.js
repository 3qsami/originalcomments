/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/


var ctools = {
	isempty: function (o) {
		return (typeof (o) == "undefined" || o == null);
	},
	adjustvalue: function (value, defaultValue) {
		if (this.isempty(defaultValue))
			return value;

		if (this.isempty(value))
			return defaultValue;

		if (typeof (value) == typeof (defaultValue))
			return value;

		switch (typeof (defaultValue)) {
			case "number":
				return parseInt(value);
				break;
			case "string":
				return value.toString();
				break;
			case "boolean":
				return (value.toString() == "true" || value.toString() == "True" || value.toString() == "1");
				break;
			default:
				return value;
				break;
		}
	},
	getcharsetbycontenttype: function (sContentType) {
		if (this.isempty(sContentType) || sContentType == "")
			return "";

		var pos = sContentType.indexOf("charset=");
		if (pos == -1)
			return "";

		var s = sContentType.substring(pos + "charset=".length);

		var pos = s.indexOf(";");
		if (pos != -1)
			s = s.substring(0, pos);

		return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
	combinenamevaluepairs: function (oObject, sCharset, sDelimiter) {
		if (this.isempty(sDelimiter))
			sDelimiter = '&';

		//在tools中使用一个通用的方法，需要传入charset,大小写 codepage
		var sPairs = '';
		for (var sName in oObject) {
			var sValue = oObject[sName];
			sPairs += (sName + '=' + this.encodeurlcomponent(sValue, sCharset) + sDelimiter);
		}

		var nLen = sPairs.length;
		if (nLen > 0)
			sPairs = sPairs.substring(0, nLen - 1);

		return sPairs;
	},
	encodeurlcomponent: function (sValue, sCharset) {
		sCharset = sCharset.toString().toLowerCase();
		if (sCharset == "gb2312" || sCharset == "936")
			return GBEncode(sValue);
		else
			return encodeURIComponent(sValue);
	},
	getDomainUrl: function (baseUrl) {
		var pos1 = baseUrl.indexOf('//');
		if (pos1 > -1) {
			var pos2 = baseUrl.indexOf('/', pos1 + 2);
			if (pos2 == -1)
				return baseUrl;
			else
				return baseUrl.substring(0, pos2);
		}

		//default
		return "";
	},
	combineUrl: function (relativeUrl, baseUrl) {
		//
		if (relativeUrl.substring(0, 4).toLowerCase() == 'http')
			return relativeUrl;

		//
		var sBase1 = '', sBase2 = '';
		var pos1 = baseUrl.indexOf('//');
		if (pos1 > -1) {
			var pos2 = baseUrl.indexOf('/', pos1 + 2);
			if (pos2 == -1) {
				sBase1 = baseUrl;
				sBase2 = '';
			}
			else {
				sBase1 = baseUrl.substring(0, pos2);

				sBase2 = baseUrl.substring(pos2 + 1);

				var pos3 = sBase2.lastIndexOf('/');
				if (pos3 == -1) {
					sBase2 = '';
				}
				else {
					sBase2 = sBase2.substring(0, pos3);
				}
			}
		}

		//
		if (relativeUrl.charAt(0) == '/')
			return sBase1 + relativeUrl;
		else if (sBase2 == '')
			return sBase1 + '/' + relativeUrl;
		else
			return sBase1 + '/' + sBase2 + '/' + relativeUrl;
	},
	getAttribute: function (oObject, sName, sDefaultValue) {
		var sValue;
		if (oObject) {
			if (oObject.getAttribute) {
				sValue = oObject.getAttribute(sName);
			}
			else {
				sValue = oObject[sName];
			}
		}

		return this.adjustvalue(sValue, sDefaultValue);
	},
	setAttribute: function (oObject, sName, sValue) {
		if (oObject.setAttribute)
			oObject.setAttribute(sName, sValue);
		else
			oObject[sName] = sValue;
	},
	createDelegate: function (oObject, oMethod, oContext) {
		return function () {
			var oArray = new Array();
			for (var i = 0; i < arguments.length; i++)
				oArray[i] = arguments[i];
			oArray[i] = oContext;
			oMethod.apply(oObject, oArray);
		};
	},
	getInnerText: function (oElement) {
		var s = oElement.innerText;
		if (this.isempty(s))
			s = oElement.textContent;

		return s;
	},
	getFirstJQElement: function (jqObject) {
		if (jqObject != null && jqObject.size() > 0)
			return jqObject.get(0);
		else
			return null;
	},
	appendQueryStringValue: function (sURL, sName, sValue) {
		var s = encodeURIComponent(sValue);
		if (sURL.indexOf('?') == -1)
			return sURL + '?' + sName + '=' + s;
		else
			return sURL + '&' + sName + '=' + s;
	},
	nodeFromXML: function (sXML) {
		if (String2.isEmpty(sXML))
			return null;

		var oParser = new DOMParser();
		var oDoc = oParser.parseFromString(sXML, 'text/xml');
		if (oDoc == null)
			return null;
		else
			return oDoc.documentElement;
	},
	adjustGuid: function (sGuid) {
		if (sGuid.charAt(0) != '{')
			sGuid = '{' + sGuid + '}';

		return sGuid.toUpperCase();
	},
	selectNodes: function (oNode, xPath) {
		var oDoc = oNode.ownerDocument;
		var oNSResolver = oDoc.createNSResolver(oDoc.documentElement);
		var aItems = oDoc.evaluate(xPath, oNode, oNSResolver,
						XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var aResult = [];
		for (var i = 0; i < aItems.snapshotLength; i++) {
			aResult[i] = aItems.snapshotItem(i);
		}
		return aResult;
	},
	selectSingleNode: function (oNode, xPath) {
		var xItems = this.selectNodes(oNode, xPath);
		if (xItems.length > 0)
			return xItems[0];
		else
			return null;
	},
	getNodeText: function (oNode) {
		var s = oNode.textContent;
		if (this.isempty(s))
			s = oNode.text;
		return s;
	},
	fixedWidth: function (s_in, width, ch) {
		var s = s_in.toString();
		if (ch == null)
			ch = ' ';

		var len = s.length;
		if (len >= width)
			return s;

		for (var i = 0; i < width - len; i++) {
			s = ch + s;
		}

		return s;
	},
	getEventElement: function (event) {
		return event.target ? event.target : event.srcElement;
	},
	splitURL: function (sURL) {
		var pos = sURL.indexOf('?');
		if (pos > -1) {
			sURL = sURL.substring(pos + 1);
		}

		var oResult = new Object();

		var oArray = sURL.split('&');
		for (var i = 0; i < oArray.length; i++) {
			var sPart = oArray[i];
			var oPart = sPart.split('=');
			oResult[oPart[0]] = decodeURIComponent(oPart[1]);
		}

		return oResult;
	},
	loadScriptSrc: function (document, sURL, callback) {
		var head = document.getElementsByTagName("head")[0] || document.documentElement;
		var script = document.createElement("script");
		script.src = sURL;
		script.type = "text/javascript";

		// Handle Script loading
		var done = false;

		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function () {
			if (!done && (!this.readyState ||
						this.readyState === "loaded" || this.readyState === "complete")) {
				done = true;

				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if (head && script.parentNode) {
					head.removeChild(script);
				}

				//ok
				callback();
			}
		};

		// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
		// This arises when a base node is used (#2709 and #4378).
		head.insertBefore(script, head.firstChild);
	},
	getObjectLength: function (obj) {
		if (Object.keys) {
			return Object.keys(obj).length;
		}
		else {
			var count = 0;
			for (var k in obj) {
				if (obj.hasOwnProperty(k)) {
					++count;
				}
			}

			return count;
		}
	},
	HTMLEncode: function (str) {
		if (str == "")
			return "";
		
		//avoid encode twice
		//var s = str.replace(/&/g, "&amp;");
		var s = str.replace(/</g, "&lt;");
		s = s.replace(/>/g, "&gt;");
		s = s.replace(/ /g, "&nbsp;");
		s = s.replace(/\'/g, "&#39;");
		s = s.replace(/\"/g, "&quot;");
		
		return s;
	}
};

var String2 = {
	compare: function (str1, str2) {
		if (str1 == str2)
			return 0;
		else if (str1 > str2)
			return 1;
		else
			return -1;
	},
	compareNoCase: function (str1, str2) {
		return this.compare(str1.toLowerCase(), str2.toLowerCase());
	},
	trim: function (str) {
		return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
	trimLeft: function (str) {
		return str.replace(/^\s\s*/, '');
	},
	trimRight: function (str) {
		return str.replace(/\s\s*$/, '');
	},
	format: function () {
		var nLen = arguments.length;
		if (nLen == 0)
			return "";
		if (nLen == 1)
			return arguments[0];

		var oAruguments = arguments;
		return arguments[0].replace(/\{(\d+)\}/g, function ($0, $1) {
			return oAruguments[parseInt($1) + 1];
		});
	},
	isEmpty: function (str) {
		return ctools.isempty(str) || str == '';
	}
};



