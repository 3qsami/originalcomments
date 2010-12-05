/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/

/// <reference path="cbase.js" />
/// <reference path="ctools.js" />

function createPageContext(window, document,jq) {
	var page = {
		combineUrl: function (relativeUrl, baseUrl) {
			return ctools.combineUrl(relativeUrl, baseUrl);
		},
		debug: function (msg, forcedebug) {
			cbase.debug(msg, forcedebug);
		}
	};

	var options = {
		getItem: function (sName, sDefaultValue) {
			return cbase.getoption(sName, sDefaultValue);
		},
		setItem: function (sName, sValue) {
			cbase.setoption(sName, sValue);
		}
	};

	var language = {
		getItem: function (sName) {
			return cbase.getlanguagevalue(sName);
		}
	};

	var Sys = {
		getElementById: function (element) {
			if (typeof (element) == "object")
				return element;
			else
				return document.getElementById(element);
		},
		getElementValue: function (element_in) {
			var element = this.getElementById(element_in);
			var sTagName = element.tagName;

			//check tagname
			if (String2.compareNoCase(sTagName, "checkbox") == 0 || String2.compareNoCase(sTagName, "radio") == 0) {
				//get the checked
				return element.getAttribute("checked");
			}
			else if (String2.compareNoCase(sTagName, "select") == 0) {
				//get select object
				if (element.selectedIndex == -1)
					return null;

				var oOption = element.options.item(element.selectedIndex);
				if (oOption == null)
					return null;

				var str = oOption.getAttribute("value");
				// not use if(String2.isEmpty(str))
				if (ctools.isempty(str))
					str = oOption.getAttribute("text");

				return str;
			}
			else {
				//check return value
				return element.getAttribute("value");
			}
		},
		getAttribute: function (oObject, sName, sDefaultValue) {
			return ctools.getAttribute(oObject, sName, sDefaultValue);
		},
		setAttribute: function (oObject, sName, sValue) {
			ctools.setAttribute(oObject, sName, sValue);
		},
		createEntityset: function () {
			return new CEntityset();
		},
		createEntity: function () {
			var oEntity = this.createEntityset();
			oEntity.addNew();
			return oEntity;
		},
		json_stringify: function (myObject) {
			return cbase.json_stringify(myObject);
		},
		json_parse: function (myJSONtext) {
			return cbase.json_parse(myJSONtext);
		},
		createDelegate: function (oObject, oMethod, oContext) {
			return ctools.createDelegate(oObject, oMethod, oContext);
		},
		selectNodes: function (oNode, xPath) {
			return ctools.selectNodes(oNode, xPath);
		},
		selectSingleNode: function (oNode, xPath) {
			return ctools.selectSingleNode(oNode, xPath);
		},
		getNodeText: function (oNode) {
			return ctools.getNodeText(oNode);
		},
		nodeFromXML: function (sXML) {
			return ctools.nodeFromXML(sXML);
		}
	};

	
	var DomElement = {
		getVisible: function (element) {
			if (element.style.display == "none")
				return false;
			else
				return element.style.visibility != "hidden";
		},
		setVisible: function (element, bVisible) { 
			var bOld=this.getVisible(element);
			if(bOld == bVisible)
				return;

			//
			if(bVisible)
			{
				//get _display
				var sDisplay=element.getAttribute("_display");
				if(String2.isEmpty(sDisplay))
					element.style.display="inline";
				else
					element.style.display=sDisplay;

				//set visibility
				element.style.visibility="visible";
			}
			else
			{
				//save _display
				var sDisplay=element.style.display;
				element.setAttribute("_display",sDisplay);

				//set display
				element.style.display="none";
			}
		},
		setVisible2: function (element, bVisible) { 
			var bOld=this.getVisible(element);
			if(bOld == bVisible)
				return;

			//
			if(bVisible)
			{
				//get _display
				var sDisplay = element.getAttribute("_visibility");
				if(String2.isEmpty(sDisplay))
					element.style.visibility = "visible";
				else
					element.style.visibility = sDisplay;

				//set display
				element.style.display = "inherit";
			}
			else
			{
				//save _display
				var sDisplay = element.style.visibility;
				element.setAttribute("_visibility", sDisplay);

				//set display
				element.style.visibility = "hidden";
			}
		}
	};

	var XMLHttpManager = {
		m_oMapRequest: {},
		m_nCounter: 0,

		openRequest2: function (sURL, oParams, oCallback) {
			return this.openRequest(sURL, oCallback, oParams);
		},
		openRequest: function (sURL, oCallback, oParams) {
			//create
			var oRequest = new CXMLHttp();

			//init
			oRequest.init();

			//Id
			var nId = ++this.m_nCounter;

			//open
			if (!oRequest.open(nId, sURL, oCallback, oParams)) {
				oRequest.close();
			}

			//record
			this.m_oMapRequest[nId] = oRequest;

			//ok
			return nId;
		},
		closeRequest: function (nRequestId) {
			//
			var oRequest = this.m_oMapRequest[nRequestId];
			if (oRequest) {
				delete this.m_oMapRequest[nRequestId];
				oRequest.close();
			}
		},
		dispose: function () {
			for (var nRequestId in this.m_oMapRequest) {
				this.closeRequest(nRequestId);
				delete this.m_oMapRequest[nRequestId];
			}
		}
	};


	//
	window.page = page;
	window.options = options;
	window.language = language;
	window.Sys = Sys;
	//window.String2 = String2;
	window.DomElement = DomElement;
	window.XMLHttpManager = XMLHttpManager;

}

//	xmlhttp
function CXMLHttp(){
	//properties
	this.m_nRequestId=0;
	this.m_sURL="";
	this.m_oCallback=null;
	this.m_oParams = null;
	this.m_oRequest=null;

	//delegate
	this._onreadystatechange = function () {
		if (this.m_oRequest.readyState == 4) {
			//
			this.m_oRequest.onreadystatechange = null;
			
			//callback
			if (this.m_oCallback)
				this.m_oCallback(this.m_oRequest, this.m_nRequestId);
			
			//close
			XMLHttpManager.closeRequest(this.m_nRequestId);
		}
	};

	//method
	this.init = function () { 
		//nothing
	};

	this.open = function (nId, sURL, oCallback, oParams) {
		//clear
		this.close();

		//id
		this.m_nRequestId = nId;

		//url
		this.m_sURL = sURL;

		//callback
		this.m_oCallback = oCallback;

		//params
		this.m_oParams = oParams;

		//request
		this.m_oRequest = cbase.createXMLHttpRequest();

		//on readystatechange
		this.m_oRequest.onreadystatechange = Sys.createDelegate(this, this._onreadystatechange);

		//verb default is get
		var sVerb = Sys.getAttribute(oParams, "httpVerb", "get");

		//user password
		var sUser = Sys.getAttribute(oParams, "user", "");
		var sPassword = Sys.getAttribute(oParams, "password", "");

		//headers
		var oHeaders = Sys.getAttribute(oParams, "headers");

		//contenttype
		var sContentType = "";
		var sCharset = "";
		if (oHeaders) {
			sContentType = Sys.getAttribute(oHeaders, "Content-Type");
			//if(String2.isEmpty(sContentType)){
			if (!ctools.isempty(sContentType) && sContentType == "") {
				//remove
				oHeaders.remove("Content-Type");
			}

			if (!String2.isEmpty(sContentType)) {
				sCharset = ctools.getcharsetbycontenttype(sContentType);
			}
		}

		//body
		var sBody = Sys.getAttribute(oParams, "body");
		if (ctools.isempty(sBody))
			sBody = "";

		//check body object?string
		if (typeof (sBody) == "object") {
			sBody = ctools.combinenamevaluepairs(sBody, sCharset);
		}

		//如果method=get,而且vBody不为空，那么就需要将body加入到url中
		if (String2.compareNoCase(sVerb, "post") != 0) {
			//combine
			if (!String2.isEmpty(sBody)) {
				if (this.m_sURL.indexOf('?') == -1)
					this.m_sURL += '?' + sBody;
				else
					this.m_sURL += '&' + sBody;
			}
		}

		//open
		this.m_oRequest.open(sVerb, this.m_sURL, true, sUser, sPassword);

		//special for cache ,must before headers,外部可以多一个机会进行修改。
		var bNoCache = Sys.getAttribute(oParams, "noCache", true);
		if (String2.compareNoCase(sVerb, "get") == 0 && bNoCache) {
			//2010.12.05 cannot use If-Modified-Since, otherwise cannot cache correctly.
			//this.m_oRequest.setRequestHeader("If-Modified-Since", "0");
			this.m_oRequest.setRequestHeader("Cache-Control", "no-cache");
		}

		//special for post ,must before headers,外部可以多一个机会进行修改。
		if (String2.compareNoCase(sVerb, "post") == 0) {
			this.m_oRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		}

		//loop set Headers
		if (oHeaders) {
			for (var sName in oHeaders) {
				this.m_oRequest.setRequestHeader(sName, oHeaders[sName]);
			}
		}

		//send
		try {
			this.m_oRequest.send(sBody);
		} catch (e) { }

		//
		return true;
	};

	this.close = function () {
		//
		if (this.m_oRequest != null) {
			this.m_oRequest.onreadystatechange = null;
			this.m_oRequest.abort();
			this.m_oRequest = null;
		}

		//
		this.m_sURL = "";
		this.m_oCallback = null;
		this.m_oParams = null;
	};
}


//	entityset

function CEntityset() {

	//properties
	this.m_oData = { m_oMap: {}, m_oArray: [], m_nCounter: 0 };

	this.m_nPos = -1;
	this.m_nPosTmp_Prev = -1;
	this.m_nPosTmp_Next = -1;

	//method
	this.getData = function () {
		return this.m_oData;
	};
	this.setData = function (oData) {
		if (oData == null)
			this.m_oData = { m_oMap: {}, m_oArray: [], m_nCounter: 0 };
		else
			this.m_oData = oData;

		this.m_nPos = -1;
		this.m_nPosTmp_Prev = -1;
		this.m_nPosTmp_Next = -1;
	}

	//
	this.isEnd = function () {
		return this.m_nPos >= this.m_oData.m_oArray.length;
	};
	this.isBegin = function () {
		return this.m_nPos <= -1; //not use 0
	}
	this.getCount = function () {
		return this.m_oData.m_oArray.length;
	};

	this.addNew = function () {
		//new
		var oEntity = new Object();
		var nEntityId = ++this.m_oData.m_nCounter;
		this.m_oData.m_oMap[nEntityId] = oEntity;

		//
		if (this.isEnd()) {
			this.m_oData.m_oArray.push(nEntityId);
			this.m_nPos = this.m_oData.m_oArray.length - 1;
		}
		else if (this.isBegin()) {
			this.m_oData.m_oArray.unshift(nEntityId);
			this.m_nPos = 0;
		}
		else {
			this.m_oData.m_oArray.splice(this.m_nPos + 1, 0, nEntityId);
			this.m_nPos = this.m_nPos + 1;
		}
	};

	this.addNewBefore = function () {
		//new
		var oEntity = new Object();
		var nEntityId = ++this.m_oData.m_nCounter;
		this.m_oData.m_oMap[nEntityId] = oEntity;

		//
		if (this.isEnd()) {
			this.m_oData.m_oArray.push(nEntityId);
			this.m_nPos = this.m_oData.m_oArray.length - 1;
		}
		else if (this.isBegin()) {
			this.m_oData.m_oArray.unshift(nEntityId);
			this.m_nPos = 0;
		}
		else {
			this.m_oData.m_oArray.splice(this.m_nPos, 0, nEntityId);
			this.m_nPos = this.m_nPos;
		}
	};

	this.close = function () {
		this.m_oData = null;

		this.m_nPos = -1;
		this.m_nPosTmp_Prev = -1;
		this.m_nPosTmp_Next = -1;
	};

	this.dispose = function () {
		this.close();
	};

	this.Delete = function () {
		//
		if (this.isEnd() || this.isBegin())
			return;

		//
		this.m_nPosTmp_Prev = this.m_nPos - 1;
		this.m_nPosTmp_Next = this.m_nPos; 	// this.m_nPos + 1;

		//
		var nEntityId = this.m_oData.m_oArray[this.m_nPos];
		delete this.m_oData.m_oMap[nEntityId];
		this.m_oData.m_oArray.splice(this.m_nPos, 1);

		//-2 means deleted
		this.m_nPos = -2;
	};

	this.moveNext = function () {
		if (this.m_nPos == -2) {
			this.m_nPos = this.m_nPosTmp_Next;
			this._resetTmpPos();
		}
		else {
			if (!this.isEnd())
				this.m_nPos = this.m_nPos + 1;
		}
	};

	this.movePrevious = function () {
		if (this.m_nPos == -2) {
			this.m_nPos = this.m_nPosTmp_Prev;
			this._resetTmpPos();
		}
		else {
			if (!this.isBegin())
				this.m_nPos = this.m_nPos - 1;
		}
	};

	this.moveFirst = function () {
		this.m_nPos = 0;
	};

	this.moveLast = function () {
		this.m_nPos = this.m_oData.m_oArray.length - 1;
	};

	this.remove = function (sName) {
		var oEntity = this._getEntityCurrent();
		if (oEntity != null) {
			delete oEntity[sName];
		}
	};

	this.getAttribute = function (sName, sDefaultValue) {
		var oEntity = this._getEntityCurrent();
		if (oEntity == null)
			return null;
		else
			return ctools.adjustvalue(oEntity[sName], sDefaultValue);
	};

	this.setAttribute = function (sName, sValue) {
		var oEntity = this._getEntityCurrent();
		if (oEntity != null) {
			oEntity[sName] = sValue;
		}
	};

	this.getEntityCurrent = function () {
		return this._getEntityCurrent();
	};

	this.copyTo = function (oEntityset) {
		var oEntity = this._getEntityCurrent();
		if (oEntity != null) {
			for(var sName in oEntity){
				oEntityset.setAttribute(sName, oEntity[sName]);
			}
		}
	};

	////// private
	this._resetTmpPos = function () {
		this.m_nPosTmp_Prev = -1;
		this.m_nPosTmp_Next = -1;
	};

	this._getEntityCurrent = function () {
		if (this.isEnd() || this.isBegin())
			return null;

		return this.m_oData.m_oMap[this.m_oData.m_oArray[this.m_nPos]];
	};

}

//
CEntityset.getDataLength = function (oData) {
	if (oData == null)
		return 0;
	else
		return oData.m_oArray.length;
};
