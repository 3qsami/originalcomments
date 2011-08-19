

//	platform
CBase.prototype.getPlatform = function () {
	return "chrome";
}

// Helper function to output debug statements
CBase.prototype.debug = function (msg, forcedebug) {
	if (forcedebug === true || this.m_bDebug) {
		if (console) {
			console.log(msg);
		} 
	}
};

//	message
CBase.prototype.sendmessage_impl = function (params, callback) {
	chrome.extension.sendRequest(params, callback);
}

//				tabguid is tabid
CBase.prototype.sendmessagetab_impl = function (tabguid, params, callback) {
	chrome.tabs.sendRequest(tabguid, params, callback);
}

//	receive message
CBase.prototype.onreceivemessage = function (callback) {
	chrome.extension.onRequest.addListener(function (params, sender, onresponse) {
		callback(params.action, params.value, sender.tab.id, onresponse);
	});
}

CBase.prototype.onreceivemessagetab = function (tabguid,callback) {
	chrome.extension.onRequest.addListener(function (params, sender, onresponse) {
		callback(params.action, params.value, onresponse);
	});
}

CBase.prototype.onreceivemessage_u = function () {
	//nothing
}

CBase.prototype.onreceivemessagetab_u = function (tabguid) {
	//nothing
}

//	options
CBase.prototype.getoption_impl = function (sName) {
	return localStorage.getItem(sName);
}

//
CBase.prototype.setoption_impl = function (sName, sValue) {
	localStorage.setItem(sName, sValue);
}
CBase.prototype.removeoption_impl = function (sName) {
	localStorage.removeItem(sName);
}

//	json
CBase.prototype.json_stringify = function (myObject) {
	return JSON.stringify(myObject);
}
//	use default implementation
//CBase.prototype.json_parse = function (myJSONtext) {
//	return JSON.parse(myJSONtext);
//}

//	language
CBase.prototype.getlanguagevalue = function (sName) {
	return chrome.i18n.getMessage(sName);
}

//	xmlhttprequest
CBase.prototype.createXMLHttpRequest = function () {
	return new XMLHttpRequest();
}

//	url
CBase.prototype.getURL = function (sURL) {
	return chrome.extension.getURL(sURL);
}

//	newTab
CBase.prototype.newTab = function (url, active) {
	chrome.tabs.create({ url: url, selected: active });
}

//	notifyFollowCommentsChanged
CBase.prototype.notifyFollowCommentsChanged = function (nCount) {
	var sText = nCount == 0 ? "" : nCount.toString();
	chrome.browserAction.setBadgeText({ text: sText });
}

CBase.prototype.getCookie = function (url, name, callback) {
	chrome.cookies.get({ "url": url, "name": name },
				function (cookie) {
					callback(cookie?cookie.value:null);
				}
			);
}

CBase.prototype.setCookie = function (url, name, value) {
	chrome.cookies.set({ "url": url, "name": name, value: value });
}

