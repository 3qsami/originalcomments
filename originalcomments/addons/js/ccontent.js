/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/

/// <reference path="cbase.js" />
/// <reference path="ctools.js" />


function createContentContext(window, document, jq) {
	
	//
	var ccontent = {

		//	properties

		m_oOptions: null,
		m_oContentHost: null,
		m_oFeedToolsSystem: null,

		//	method

		start: function (oContentHost) {
			var oThis = this;

			//
			oThis.m_oContentHost = oContentHost;

			// content callback
			cbase.onreceivemessagetab(oThis.m_oContentHost.getTabGuid(), ctools.createDelegate(oThis, oThis._onreceivemessagetab));

			//	unload
			window.addEventListener("unload", ctools.createDelegate(oThis, oThis._onunload), false);

			//
			this._registerClient();
		},

		_registerClient: function () {
			var oThis = this;
			var bStatus = false;

			//1.	register
			cbase.sendmessage("register", null, function (bResult) {
				//
				bStatus = bResult;

				//check
				if (bStatus === true && oThis.m_oOptions == null) {
					//2.	get options
					cbase.sendmessage("getOptions", null, function (oParams) {

						//check again
						if (oThis.m_oOptions == null) {
							oThis.m_oOptions = oParams;

							//3. start check
							oThis.m_oFeedToolsSystem = new feed_tools_system(window, document, jq);
							oThis.m_oFeedToolsSystem.initialize(oThis);
						}
					});
				}
			});

			//wait register to complete
			window.setTimeout(function () {
				if (bStatus === false) {
					oThis._registerClient();
				}
			}, 1000);
		},

		//	content callback
		_onreceivemessagetab: function (actionname, params, onresponse) {
			var oThis = this;

			if (actionname == "optionsChanged") {
				oThis.m_oOptions = params;
				onresponse(null);
			}
		},

		//	unload
		_onunload: function () {
			var oThis = this;

			cbase.onreceivemessagetab_u(oThis.m_oContentHost.getTabGuid());
			cbase.sendmessage("unregister", null, function () { }); 	//callback cannot null

			if (oThis.m_oFeedToolsSystem != null) {
				oThis.m_oFeedToolsSystem.dispose();
				oThis.m_oFeedToolsSystem = null;
			}

			oThis.m_oOptions = null;
			oThis.m_oContentHost = null;
		},

		refreshCurrentArticleComments: function () {
			if (this.m_oFeedToolsSystem != null) {
				this.m_oFeedToolsSystem.refreshCurrentArticleCommentsOuter();
			}
		},
		getCurrentArticleIndex: function () {
			if (this.m_oFeedToolsSystem != null) {
				return this.m_oFeedToolsSystem.getCurrentArticleIndex();
			}
			else {
				return 0;
			}
		}

	};

	
	//
	return ccontent;
}


////		-- class
function feed_tools_system(window, document, jq) {
	////	-- variables
	this._oContent = null;
	this._events = null;
	this._events_system = null;

	this._timerId = 0;
	this._oAdvancedComments = null;
	this._oAdvancedCommentsHelper = null;
	this._oMapForArticles = null;
	this._nArticleCounter = 0;
	this._oMapForFeeds = null;

	this._nCurrentArticleIndex = 0;


	////	-- methods
	this.initialize = __initialize;
	this.dispose = __dispose;

	//		-- functions
	this._checkClient = __checkClient;
	this._readerOnline_start = __readerOnline_start;
	this._setglobalfunctions = __setglobalfunctions;
	this._createtimer = __createtimer;
	this._createAdvancedComments = __createAdvancedComments;
	this._tryconfig = __tryconfig;
	this._tryconfigAndShow = __tryconfigAndShow;
	this._getcommentsbuttonscontainer = __getcommentsbuttonscontainer;
	this._getcommentscontainer = __getcommentscontainer;
	this._getcommentscontainervisible = __getcommentscontainervisible;
	this._setcommentscontainervisible = __setcommentscontainervisible;
	this._setcomments = __setcomments;
	this._setcomments2 = __setcomments2;
	this.refreshArticleComments = __refreshArticleComments;
	this.refreshCurrentArticleCommentsOuter = __refreshCurrentArticleCommentsOuter;
	this.getCurrentArticleIndex = __getCurrentArticleIndex;
	this.getCurrentArticleEntity=__getCurrentArticleEntity;
	this._fire_ongetcurrentarticle = __fire_ongetcurrentarticle;
	this._prepareArticleEntity = __prepareArticleEntity;
	this._switchcomments = __switchcomments;
	this._getparentscrollcontainer = __getparentscrollcontainer;
	this._checkcommentsbuttoncontainerposition = __checkcommentsbuttoncontainerposition;

	//2010.08.03
	this._autotrack_getcommentsparams_trackurl = __autotrack_getcommentsparams_trackurl;
	this._autotrack_gettrackcontainer = __autotrack_gettrackcontainer;
	this._autotrack_gettrackcontainervisible = __autotrack_gettrackcontainervisible;
	this._autotrack_prefetchenabled = __autotrack_prefetchenabled;
	this._autotrack_prefetchenabledinterval = __autotrack_prefetchenabledinterval;
	this._autotrack_prefetchautodisplay = __autotrack_prefetchautodisplay;
	this._autotrack_enabled = __autotrack_enabled;
	this._autotrack_height = __autotrack_height;
	this._autotrack_leftmargin = __autotrack_leftmargin;
	this._autotrack_rightmargin = __autotrack_rightmargin;
	this._autotrack_showorder=__autotrack_showorder;
	this._autotrack_clearoldarticles = __autotrack_clearoldarticles;
	this._autotrack_createcontentparts = __autotrack_createcontentparts;
	this._autotrack_parsepage = __autotrack_parsepage;
	this._forceshowcommentscontainer = __forceshowcommentscontainer;
	this._loadingStart = __loadingStart;
	this._loadingStop = __loadingStop;

	this._currentArticleIndexChanged = __currentArticleIndexChanged;

	this._debug_enabled = __debug_enabled;

	//
	
	this._createevent = __createevent;
	this._fireevent = __fireevent;
	this._fireevent_call = __fireevent_call;
	this._adjustreturnvalue = __adjustreturnvalue;

	//delegate
	this._delegate_click_feedback = null;
	this._delegate_click_requestForm = null;
	this._delegate_click_checkAgain = null;
	this._delegate_click_followComments = null;
	this._delegate_click_showOrder = null;
	this._delegate_click_refresh = null;
	this._delegate_click_showPage = null;
	this._delegate_click_showComments = null;

	//dispose
	function __dispose() {
		//
		this._createtimer(false);

		//
		this._createAdvancedComments(false);

		//
		this._setglobalfunctions(false);

		//
		this._oMapForArticles = null;
		this._oMapForFeeds = null;

		//events
		if (this._events != null) {
			this._events.dispose();
			this._events = null;
		}

		//events system
		if (this._events_system != null) {
			this._events_system.dispose();
			this._events_system = null;
		}
	}

	//initialize
	function __initialize(oContent) {
		var oThis = this;

		//
		this._oContent = oContent;
		
		//events
		var oClass = this._oContent.m_oContentHost.getReaderEventClass();
		this._events = new oClass(window, document, jq);
		if (this._events != null)
			this._events.initialize();

		//events system feed_readerOnline_events_system
		this._events_system = new feed_readerOnline_events_system(window, document, jq);
		if (this._events_system != null)
			this._events_system.initialize();

		//prepare
		this._events.prepare1(function (bSucceeded, sClientId) {
			if (bSucceeded) {
				oThis._checkClient(sClientId);
			}
		});
	}

	function __checkClient(sClientId) {
		var oThis = this;
		cbase.sendmessage("checkClient", sClientId, function (oResult) {
			if (oResult==null) {
				//try again after 10 seconds
				window.setTimeout(function () { oThis._checkClient(sClientId); }, 1000 * 10);
			}
			else {
				var bReady=oResult["ready"];
				if (bReady) {
					oThis._events.prepare2(function (bSucceeded) {
						if (bSucceeded) {
							oThis._readerOnline_start();
						}
					});
				}
				else { 
					//do nothing
				}
			}
		});
	}

	//
	function __readerOnline_start() {
		var oThis = this;

		//
		this._oMapForArticles = new Object();
		this._oMapForFeeds = new Object();

		//
		this._setglobalfunctions(true);

		//
		this._createAdvancedComments(true);

		//
		this._createtimer(true);

		//hotkeys
		jq(document).bind("keydown", function (event) {
			var code = event.which ? event.which : event.keyCode;
			if (code == 255)
				return;

			//
			if (code == 38 || code == 40) {

			}
			else if (code == parseInt(oThis._oContent.m_oOptions["shortcuts_showcomments"])
						&& !event.ctrlKey
						&& !event.altKey
						&& !event.shiftKey
						) {
				//not input or textarea
				var oElement = ctools.getEventElement(event);
				var sTagName = oElement.tagName.toLowerCase();
				if (sTagName == "input" || sTagName == "textarea")
					return;

				//current article
				var oEntity = oThis.getCurrentArticleEntity();
				if (oEntity != null) {
					oThis._switchcomments(oEntity);
					return false;
				}
			}
		});
	}

	function __setglobalfunctions(bSet) {
		if (bSet) {
			this._delegate_click_feedback = ctools.createDelegate(this, __pimshell_click_feedback);
			this._delegate_click_requestForm = ctools.createDelegate(this, __pimshell_click_requestForm);
			this._delegate_click_checkAgain = ctools.createDelegate(this, __pimshell_click_checkAgain);
			this._delegate_click_followComments = ctools.createDelegate(this, __pimshell_click_followComments);
			this._delegate_click_showOrder = ctools.createDelegate(this, __pimshell_click_showOrder);
			this._delegate_click_refresh = ctools.createDelegate(this, __pimshell_click_refresh);
			this._delegate_click_showPage = ctools.createDelegate(this, __pimshell_click_showPage);
			this._delegate_click_showComments = ctools.createDelegate(this, __pimshell_click_showComments);
		}
		else {
			this._delegate_click_feedback = null;
			this._delegate_click_requestForm = null;
			this._delegate_click_checkAgain = null;
			this._delegate_click_followComments = null;
			this._delegate_click_showOrder = null;
			this._delegate_click_refresh = null;
			this._delegate_click_showPage = null;
			this._delegate_click_showComments = null;
		}
	}

	function __createtimer(bCreate) {
		if (bCreate) {
			this._timerId = window.setInterval(ctools.createDelegate(this, __interval_callback), 300);
		}
		else {
			if (this._timerId != 0) {
				window.clearInterval(this._timerId);
				this._timerId = 0;
			}
		}
	}

	function __createAdvancedComments(bCreate) {
		if (bCreate) {
		}
		else {
		}
	}

	function __fire_ongetcurrentarticle() {
		//raise event of ongetcurrentarticle
		var oEvent = this._createevent();
		oEvent.articleElement = null;
		oEvent.articleLink = "";
		oEvent.articleTitle = "";
		oEvent.feedElement = null;
		oEvent.feedLink = "";
		oEvent.feedTitle = "";
		oEvent.formId = "";
		this._fireevent("ongetcurrentarticle", oEvent);
		return oEvent;
	}

	function __interval_callback() {
		try {
			//get the current aritcle
			//raise event of ongetcurrentarticle
			var oEvent = this._fire_ongetcurrentarticle();
			if (oEvent.returnValue === true) {
				//adjust	not use toLowerCase
				//oEvent.articleLink = oEvent.articleLink.toLowerCase();
				//oEvent.feedLink = oEvent.feedLink.toLowerCase();

				//
				var oArticleElement = oEvent.articleElement;
				var sArticleLink = oEvent.articleLink;
				var sArticleTitle = oEvent.articleTitle;

				if (oArticleElement != null && sArticleLink != "" && sArticleTitle != "") {

					//2010.11.14 set index to article element
					var nIndex = ctools.getAttribute(oArticleElement, "_index_oc", 0);
					if (nIndex == 0) {
						//assign index
						nIndex=++this._nArticleCounter;
						oArticleElement.setAttribute('_index_oc', nIndex);
					}

					//prepare entity
					var oEntity=this._prepareArticleEntity(oEvent, nIndex);

					//
					var oDiv = this._getcommentsbuttonscontainer(oEntity, false);
					if (nIndex != this._nCurrentArticleIndex || oDiv == null) {
						var nIndexOld = this._nCurrentArticleIndex;
						this._nCurrentArticleIndex = nIndex;
						this._currentArticleIndexChanged(nIndexOld, this._nCurrentArticleIndex, oEntity);
					}
				}
			}
		}
		catch (e) {
			//donnot raise any error.
		}
	}

	//
	function __prepareArticleEntity(oParams, nIndexNew) {
		//check if exsits
		var oEntity = this._oMapForArticles[nIndexNew];
		if (oEntity == null) {
			//article
			var oArticleElement = oParams["articleElement"];
			var sArticleLink = oParams["articleLink"];
			var sArticleTitle = oParams["articleTitle"];
			var sFormId = oParams["formId"];

			//feed
			var oFeedElement = oParams["feedElement"];
			var sFeedLink = oParams["feedLink"];
			var sFeedTitle = oParams["feedTitle"];

			//
			oEntity = new Object();
			oEntity["index"] = nIndexNew;
			oEntity["articleElement"] = oArticleElement;
			oEntity["articleLink"] = sArticleLink;
			oEntity["articleTitle"] = sArticleTitle;

			oEntity["feedElement"] = oFeedElement;
			oEntity["feedLink"] = sFeedLink;
			oEntity["feedTitle"] = sFeedTitle;

			oEntity["formId"] = sFormId;

			oEntity["showOrder"] = this._autotrack_showorder();

			oEntity["_ready"] = false;
			oEntity["_checkOnce"] = false;
			oEntity["_loadingStartCounter"]=0;

			//
			this._oMapForArticles[nIndexNew] = oEntity;
		}

		return oEntity;
	}

	function __getcommentsbuttonscontainer(oEntity, bCreateIfEmpty) {
		var oThis = this;

		//
		var nIndex=oEntity["index"];
		var oArticleElement=oEntity["articleElement"];

		//check div
		var oDiv = null;

		//raise event of ongetcommentscontainer
		var oEvent = this._createevent();
		oEvent.articleElement = oArticleElement;

		this._fireevent("ongetcommentsbuttonscontainer", oEvent);
		if (oEvent.cancelBubble)
			oDiv = oEvent.returnValue;
		else
			oDiv = ctools.getFirstJQElement(jq("#pimshell_commentsbuttonscontainer", oArticleElement));

		//
		if (oDiv == null) {
			if (bCreateIfEmpty) {
				//reset
				oEntity["_ready"] = false;
				oEntity["_checkOnce"] = false;

				//append div to the end
				oDiv = document.createElement("span");

				oDiv.id = 'pimshell_commentsbuttonscontainer';
				oDiv.setAttribute('_index',nIndex);
				oDiv.className = 'link unselectable pimshell_buttonscontainer_hide';

				//image
				oDiv.style.backgroundImage = String2.format("url({0})", cbase.getURL("addons/images/button16.png"));
				
				//text and loading image
				var sHtml_Buttons = String2.format("\
									<span id='showCommentsText' _index='{0}'>{1}</span><img id='loading' src='{2}' style='display:none;height:12px;width:16px;' />\
									",
									nIndex,
									cbase.getlanguagevalue("showComments"),
									cbase.getURL("addons/images/loading.gif")
									);

				oDiv.innerHTML = sHtml_Buttons;

				//click
				jq(oDiv).click(this._delegate_click_showComments);
				jq("#showCommentsText", oDiv).click(this._delegate_click_showComments);

				//raise event of onappendcommentscontainer
				var oEvent = this._createevent();
				oEvent.articleElement = oArticleElement;
				oEvent.commentscontainer = oDiv;

				this._fireevent("onappendcommentsbuttonscontainer", oEvent);
				if (!oEvent.cancelBubble) {
					oArticleElement.appendChild(oDiv);
				}

				//2010.11.20 clear old articles
				var nIndex = ctools.getAttribute(oArticleElement, "_index_oc", 0);
				this._autotrack_clearoldarticles(nIndex);

				//2010.12.22 only for viewcomments.htm as to show comments immediately.
				if (this._autotrack_enabled()) {
					//switch
					this._switchcomments(oEntity);
				}

			}
		}

		return oDiv;
	}

	function __getcommentscontainer(oEntity, bCreateIfEmpty) {
		//
		var oArticleElement = oEntity["articleElement"];

		//check div
		var oDiv = null;

		//raise event of ongetcommentscontainer
		var oEvent = this._createevent();
		oEvent.articleElement = oArticleElement;

		this._fireevent("ongetcommentscontainer", oEvent);
		if (oEvent.cancelBubble)
			oDiv = oEvent.returnValue;
		else
			oDiv = ctools.getFirstJQElement(jq("#pimshell_advancedcomments",oArticleElement));

		//
		if (oDiv == null) {
			if (bCreateIfEmpty) {
				//append div to the end
				oDiv = document.createElement("div");

				oDiv.id = 'pimshell_advancedcomments';
				oDiv.className = 'pimshell_commentscontainer';

				//raise event of onappendcommentscontainer
				var oEvent = this._createevent();
				oEvent.articleElement = oArticleElement;
				oEvent.commentscontainer = oDiv;

				this._fireevent("onappendcommentscontainer", oEvent);
				if (!oEvent.cancelBubble) {
					oArticleElement.appendChild(oDiv);
				}

				////2010.11.20 clear old articles
				//var nIndex = ctools.getAttribute(oArticleElement, "_index_oc", 0);
				//this._autotrack_clearoldarticles(nIndex);
			}
		}

		return oDiv;
	}

	function __currentArticleIndexChanged(nIndexOld, nIndexNew, oEntity) {
		var oThis = this;

		//append commentbuttons
		this._getcommentsbuttonscontainer(oEntity, true);

		//2010.12.21
		if (oEntity["_checkOnce"] == false) {
			if (this._autotrack_prefetchenabled()) {
				var nInterval = this._autotrack_prefetchenabledinterval() * 1000;
				window.setTimeout(function () {
					if (oThis.getCurrentArticleIndex() == nIndexNew) {
						oThis._tryconfigAndShow(oEntity, true, false);
					}
				}, nInterval);
			}
		}
	}

	function __tryconfigAndShow(oEntity, bForceTry,bShowComments) {
		var oThis=this;

		this._tryconfig(oEntity, bForceTry, function (bReady) {
			//totalcount
			if (oEntity["formId"] != "" && oEntity["totalcount"] == null) {
				//parse page one
				oThis._autotrack_parsepage(oEntity, 1, false);
			}

			//show
			if (bReady && bShowComments) {
				oThis._setcomments2(oEntity);
			}
		});
	}

	function __tryconfig(oEntity, bForceTry, oCallback) {
		var oThis = this;

		//only check once
		oEntity["_checkOnce"] = true;

		//article
		var oArticleElement = oEntity["articleElement"];
		var sArticleLink = oEntity["articleLink"];
		var sArticleTitle = oEntity["articleTitle"];
		var sFormId = oEntity["formId"];

		//feed
		var oFeedElement = oEntity["feedElement"];
		var sFeedLink = oEntity["feedLink"];
		var sFeedTitle = oEntity["feedTitle"];

		//check if exists
		var oDiv = this._getcommentsbuttonscontainer(oEntity, true);
		if (oDiv == null)
		{
			oCallback(false);
			return;
		}

		//check ready
		var bReady = oEntity["_ready"];
		if (bReady && !bForceTry) {
			oCallback(bReady);
			return;
		}

		//
		if (!String2.isEmpty(oEntity["formId"])) {
			oThis._setcomments(oEntity);
			oCallback(true);
		}
		else {
			//check feed
			var oTmp = new Object();
			oTmp["index"] = oEntity["index"];
			oTmp["articleLink"] = oEntity["articleLink"];
			oTmp["articleTitle"] = oEntity["articleTitle"];
			oTmp["feedLink"] = oEntity["feedLink"];
			oTmp["feedTitle"] = oEntity["feedTitle"];
			oTmp["formId"] = oEntity["formId"];

			//loading
			oThis._loadingStart(oEntity);

			//
			cbase.sendmessage("commentsCheck", oTmp, function (oParams) {
				//
				oThis._loadingStop(oEntity);
				//
				oEntity["formId"] = oParams["formId"];
				oEntity["formStep"] = oParams["formStep"];
				oEntity["checkStatus"] = oParams["succeeded"];
				oThis._setcomments(oEntity);
				oCallback(true);
			});
		}
	}

	//
	function __setcomments2(oEntity) {
		var oThis = this;

		//info
		var oArticleElement = oEntity["articleElement"];
		var nIndex = oEntity["index"];

		var sFormId = oEntity["formId"];
		var bCheckStatus=oEntity["checkStatus"];

		//force exists
		var oDiv = this._getcommentscontainer(oEntity, true);

		//
		var sHtml_Comment = "";
		if(bCheckStatus===false)
		{
			sHtml_Comment = String2.format("<div style='text-align:center;'>\
										<span id='cmd_checkAgain' _index='{0}' class='pimshell_warning pimshell_link unselectable' style='margin-right:4px;'>{1}</span>\
										</div>",
										nIndex,
										cbase.getlanguagevalue("checkagainTitle")
										);
		}
		else if(sFormId==""){
			sHtml_Comment = String2.format("<div style='text-align:center;'>\
										<span id='cmd_requestForm' _index='{0}' class='pimshell_warning pimshell_link unselectable' style='margin-right:4px;'>{1}</span>\
										</div>",
										nIndex,
										cbase.getlanguagevalue("requestFormTitle")
										);
		}
		else{
			sHtml_Comment="";
		}

		//
		if (sHtml_Comment == "") {
			//do nothing			
		}
		else
		{
			//set html
			oDiv.innerHTML = sHtml_Comment;

			//events
			jq("#cmd_requestForm", oDiv).click(this._delegate_click_requestForm);
			jq("#cmd_checkAgain", oDiv).click(this._delegate_click_checkAgain);

		}

		//show comments
		oThis._forceshowcommentscontainer(oEntity, function () {
			//visible
			oThis._setcommentscontainervisible(oEntity, true, function () { });
		});
	}

	//
	function __setcomments(oEntity, bVisibleOptional) {
		//info
		var oArticleElement = oEntity["articleElement"];
		var nIndex = oEntity["index"];

		var sFormId = oEntity["formId"];
		var bCheckStatus=oEntity["checkStatus"];
		
		//check if exists
		var oDiv = this._getcommentsbuttonscontainer(oEntity, false);
		if (oDiv == null) {
			//may be cleared.
			return;
		}

		//
		var sTextStatus="";
		if (bCheckStatus === false) {
			sTextStatus = String2.format("(<span _index='{0}' class='pimshell_warning'>{1}</span>)",
											nIndex, cbase.getlanguagevalue("accessFailed")
										);
		}
		else if (sFormId == "")
		{
			sTextStatus = String2.format("(<span _index='{0}' class='pimshell_warning'>{1}</span>)",
											nIndex, cbase.getlanguagevalue("notSupported")
										);
		}
		else{
			var nTotalCount=oEntity["totalcount"];
			if(nTotalCount!=null){
				sTextStatus = String2.format("(<span _index='{0}' class='pimshell_warning'>{1}</span>)",
											nIndex, nTotalCount
										);
			}
		}

		//visible
		var bVisible;
		if (bVisibleOptional != null)
			bVisible = bVisibleOptional;
		else
			bVisible=this._getcommentscontainervisible(oEntity);

		//text and css
		var sText;
		var sClassName;
		if (bVisible) {
			sText = cbase.getlanguagevalue("hideComments");
			sClassName = 'link unselectable pimshell_buttonscontainer_show';
		}
		else{
			sText = cbase.getlanguagevalue("showComments");
			sClassName = 'link unselectable pimshell_buttonscontainer_hide';
		}

		//set text
		sText+=sTextStatus;
		jq("#showCommentsText",oDiv).html(sText);

		//set css
		oDiv.className = sClassName;

		//ready
		oEntity["_ready"] = true;
	}

	function __debug_enabled() {
		//raise event of ongetoption
		var oEvent = this._createevent();
		oEvent.name = "debug_enabled";
		oEvent.value = false;

		this._fireevent("ongetoption", oEvent);
		if (oEvent.cancelBubble)
			return oEvent.returnValue;
		else
			return oEvent.value;
	}

	function __autotrack_prefetchenabled() {
		//raise event of ongetoption
		var oEvent = this._createevent();
		oEvent.name = "autoview_prefetchenabled";
		oEvent.value = this._oContent.m_oOptions["autoview_prefetchenabled"];

		this._fireevent("ongetoption", oEvent);
		if (oEvent.cancelBubble)
			return oEvent.returnValue;
		else
			return oEvent.value;
	}

	function __autotrack_prefetchenabledinterval() {
		return this._oContent.m_oOptions["autoview_prefetchinterval"];
	}

	function __autotrack_prefetchautodisplay() {
		return this._oContent.m_oOptions["autoview_prefetchautodisplay"];
	}

	function __autotrack_enabled() {
		//raise event of ongetoption
		var oEvent = this._createevent();
		oEvent.name = "autoview_enabled";
		oEvent.value = this._oContent.m_oOptions["autoview_enabled"];

		this._fireevent("ongetoption", oEvent);
		if (oEvent.cancelBubble)
			return oEvent.returnValue;
		else
			return oEvent.value;
	}

	function __autotrack_height() {
		//raise event of ongetoption
		var oEvent = this._createevent();
		oEvent.name = "autoview_height";
		oEvent.value = this._oContent.m_oOptions["autoview_height"];

		this._fireevent("ongetoption", oEvent);
		if (oEvent.cancelBubble)
			return oEvent.returnValue;
		else
			return oEvent.value;
	}
	function __autotrack_leftmargin() {
		return this._oContent.m_oOptions["autoview_leftmargin"];
	}
	function __autotrack_rightmargin() {
		return this._oContent.m_oOptions["autoview_rightmargin"];
	}
	function __autotrack_showorder(){
		return this._oContent.m_oOptions["autoview_showorder"];
	}

	function __autotrack_getcommentsparams_trackurl(oEntity) {
		//this._oAdvancedCommentsHelper.parse(oEntity("articleLink"), oEntity("formId"), oEntity("index"));
		//var sURL = this._oAdvancedCommentsHelper.GetCommentsParamsTrackURL();
		//return sURL;
		return "";
	}

	function __getcommentscontainervisible(oEntity){
		var oDiv = this._getcommentscontainer(oEntity, false);
		if (oDiv == null)
			return false;
		else
			return oDiv.style.display != "none";
	}

	function __setcommentscontainervisible(oEntity, bVisible,oCallback) {
		var oThis = this;

		var oDiv = this._getcommentscontainer(oEntity, bVisible);
		if (oDiv == null) {
			if (oCallback != null) oCallback(null);
			return;
		}
		else {
			//first, change buttons style
			if (bVisible) {
				oThis._setcomments(oEntity, bVisible);
			}

			//
			var oMethod = bVisible ? jq(oDiv).slideDown : jq(oDiv).slideUp;
			oMethod.call(jq(oDiv), "normal", function () {
				//last, change buttons style
				if (!bVisible) {
					oThis._setcomments(oEntity, bVisible);
				}

				//
				if (oCallback != null) oCallback(null);
				return;
			});
		}
	}

	function __autotrack_gettrackcontainervisible(oEntity) {
		var oDiv2 = this._autotrack_gettrackcontainer(oEntity, false);
		if (oDiv2 == null)
			return false;
		else
			return oDiv2.style.display != "none";
	}

	function __autotrack_gettrackcontainer(oEntity, bCreateIfEmpty) {
		var oArticleElement = oEntity["articleElement"];

		var oDiv = this._getcommentscontainer(oEntity, bCreateIfEmpty);
		if (oDiv == null)
			return null;

		var oDiv2 = ctools.getFirstJQElement(jq("#pimshell_advancedcomments_autotrack", oDiv));
		if (oDiv2 == null) {
			if (bCreateIfEmpty) {
				//oDiv2
				oDiv2 = document.createElement("div");

				oDiv2.id = 'pimshell_advancedcomments_autotrack';
				oDiv2.style.cssText = String2.format('height:{0}px;padding-right:{1}px;padding-left:{2}px;',
												parseInt(this._autotrack_height()) + 70,
												this._autotrack_rightmargin(), this._autotrack_leftmargin());

				oDiv2.className = 'pimshell_comments';

				oDiv.appendChild(oDiv2);

				//content parts
				this._autotrack_createcontentparts(oDiv2, oEntity);

				//parse page one
				this._autotrack_parsepage(oEntity, 1,false);
			}
		}

		//
		return oDiv2;
	}

	function __loadingStart(oEntity) {
		if(oEntity["_loadingStartCounter"]++ ==0)
		{
			//
			var oSpan1=this._getcommentsbuttonscontainer(oEntity,false);
			if(oSpan1==null)
				return;

			//loading
			jq("#loading", oSpan1).show();
		}
	}

	function __loadingStop(oEntity) {
		if (--oEntity["_loadingStartCounter"] == 0)
		{
			//
			var oSpan1=this._getcommentsbuttonscontainer(oEntity,false);
			if(oSpan1==null)
				return;

			//loading
			jq("#loading", oSpan1).hide();
		}
	}

	function __autotrack_parsepage(oEntity, nPageIndex,bForceTop) {
		var oThis = this;

		//
		var oSpan1=oThis._getcommentsbuttonscontainer(oEntity,false);
		if(oSpan1==null)
			return;

		//loading
		oThis._loadingStart(oEntity);

		//params
		var oParams = new Object();
		oParams["pageIndex"] = nPageIndex;
		oParams["showOrder"] = oEntity["showOrder"];
		oParams["articleLink"] = oEntity["articleLink"];
		oParams["articleTitle"] = oEntity["articleTitle"];
		oParams["formId"] = oEntity["formId"];
		oParams["articleIndex"] = oEntity["index"];

		oParams["debug_enabled"] = oThis._debug_enabled();
			
		//
		cbase.sendmessage("showPage", oParams, function (oResult) {
			//loading
			oThis._loadingStop(oEntity);

			//do nothing
			if (oResult == null)
				return;

			//if failed donnot change anything
			if (oResult["status"] != "succeeded")
				return;

			//page info
			var nTotalCount = oResult["totalcount"];
			var nPageCount = oResult["pagecount"];
			var nPageSize = oResult["pagesize"];

			//record totalcount for show
			oEntity["totalcount"] = nTotalCount;
			oThis._setcomments(oEntity);

			//oDiv2 maybe null
			var bForceCreateDiv2 = !bForceTop && oThis._autotrack_prefetchautodisplay() && nTotalCount > 0;
			var oDiv2 = oThis._autotrack_gettrackcontainer(oEntity, bForceCreateDiv2);
			if (oDiv2 == null)
				return;

			//toolbar
			var oPageInfo = jq("#pageInfo", oDiv2);
			oPageInfo.css({ 'visibility': 'visible' }); //.show();
			jq("#pageIndex", oPageInfo).text(nPageIndex);
			jq("#pageCount", oPageInfo).text(nPageCount);

			//article link maybe changed
			jq("#pimshell_advancedcomments_autotrack_toolbar #gotoarticle", oDiv2).attr("href", oEntity["articleLink"]);

			//pager
			var oPager = jq("#pimshell_advancedcomments_autotrack_pager", oDiv2);
			jq("#pageFirst", oDiv2).attr('src',
										nPageIndex <= 1 ? cbase.getURL("addons/images/page-first-disabled.png") : cbase.getURL("addons/images/page-first.png"));
			jq("#pagePrevious", oDiv2).attr('src',
										nPageIndex <= 1 ? cbase.getURL("addons/images/page-prev-disabled.png") : cbase.getURL("addons/images/page-prev.png"));
			jq("#pageNext", oDiv2).attr('src',
										nPageIndex >= nPageCount ? cbase.getURL("addons/images/page-next-disabled.png") : cbase.getURL("addons/images/page-next.png"));
			jq("#pageLast", oDiv2).attr('src',
										nPageIndex >= nPageCount ? cbase.getURL("addons/images/page-last-disabled.png") : cbase.getURL("addons/images/page-last.png"));

			//content
			jq("#pimshell_advancedcomments_autotrack_content", oDiv2).html(oResult["content"]).attr('scrollTop', 0);

			//2010.11.22 just scrollIntoView
			if (bForceTop) {
				oThis._forceshowcommentscontainer(oEntity, function () { });
			}
			else {
				//2011.01.04 autodisplay
				if (oThis._autotrack_prefetchautodisplay() && nTotalCount > 0) {
					//visible
					oThis._setcommentscontainervisible(oEntity, true, function () { });
				}
			}

		});	
	}


	//
	function __autotrack_createcontentparts(oDiv2, oEntity) {

		//
		var nIndex = oEntity["index"];
		var sShowOrder = oEntity["showOrder"];

		//pager html
		var sHtml_Pager_General = String2.format("<div class='pimshell_pager'>\
											<span id='pageInfo' class='pimshell_pageinfo'><span id='pageIndex' style='color:#5377A9;'></span>/<span id='pageCount' style=''></span></span>\
											<img id='pageFirst' _index='{0}' src='{1}' class='pimshell_warning pimshell_link unselectable' title=\"{2}\" />\
											<img id='pagePrevious' _index='{0}' src='{3}' class='pimshell_warning pimshell_link unselectable' title=\"{4}\" />\
											<img id='pageNext' _index='{0}' src='{5}' class='pimshell_warning pimshell_link unselectable' title=\"{6}\" />\
											<img id='pageLast' _index='{0}' src='{7}' class='pimshell_warning pimshell_link unselectable' title=\"{8}\" />\
										</div>\
									",
									nIndex,
									cbase.getURL("addons/images/page-first-disabled.png"),
									cbase.getlanguagevalue("pageFirst"),
									cbase.getURL("addons/images/page-prev-disabled.png"),
									cbase.getlanguagevalue("pagePrevious"),
									cbase.getURL("addons/images/page-next-disabled.png"),
									cbase.getlanguagevalue("pageNext"),
									cbase.getURL("addons/images/page-last-disabled.png"),
									cbase.getlanguagevalue("pageLast")
									);

		//toolbar
		var oToolbar = document.createElement("div");
		oToolbar.id = 'pimshell_advancedcomments_autotrack_toolbar';
		oToolbar.className = 'pimshell_comments_toolbar';
		oDiv2.appendChild(oToolbar);

		var sHtml_Toolbar = String2.format("{10}<div class='pimshell_toolbar'>\
									<img id='showOrder' _index='{0}' src='{1}' class='pimshell_warning pimshell_link unselectable' title='{2}' />\
									<img id='refresh' _index='{0}' src='{3}' class='pimshell_warning pimshell_link unselectable' title='{4}' />\
									<img id='subscribe' _index='{0}' src='{5}' class='pimshell_warning pimshell_link unselectable' title='{6}' />\
									<a id='gotoarticle' href='{7}' target='_blank' title='{8}'><img src='{9}' /></a>\
									</div>",
									nIndex,
									sShowOrder == "desc" ? cbase.getURL("addons/images/down.gif") : cbase.getURL("addons/images/up.gif"),
									cbase.getlanguagevalue("ascdesc"),
									cbase.getURL("addons/images/refresh.ico"),
									cbase.getlanguagevalue("refresh"),
									cbase.getURL("addons/images/subscribe.png"),
									cbase.getlanguagevalue("follow"),
									ctools.HTMLEncode(oEntity["articleLink"]),
									cbase.getlanguagevalue("viewOriginal"),
									cbase.getURL("addons/images/goto.gif"),
									sHtml_Pager_General
									);

		oToolbar.innerHTML = sHtml_Toolbar;

		jq("#showOrder", oToolbar).click(this._delegate_click_showOrder);
		jq("#refresh", oToolbar).click(this._delegate_click_refresh);
		jq("#subscribe", oToolbar).click(this._delegate_click_followComments);

		//content
		var oContent = document.createElement("div");
		oContent.id = 'pimshell_advancedcomments_autotrack_content';
		oContent.style.cssText = String2.format('height:{0}px;',
													this._autotrack_height()
												);
		oContent.className = 'pimshell_comments_body';
		
		//append		
		oDiv2.appendChild(oContent);

		//pager
		var oPager = document.createElement("div");
		oPager.id = 'pimshell_advancedcomments_autotrack_pager';
		oPager.className = 'pimshell_comments_pager';
		oDiv2.appendChild(oPager);

		var sHtml_Pager = String2.format("{0}<div class='pimshell_pager_feedback'><span id='feedback' _index='{1}' style='cursor:pointer;color:Green; font-weight:bold;'>* {2}</span></div>",
											sHtml_Pager_General,
											nIndex,
											cbase.getlanguagevalue("viewcommentfeedbackprompt")
										);

		oPager.innerHTML = sHtml_Pager;

		jq("#pageFirst", oDiv2).click(this._delegate_click_showPage);
		jq("#pagePrevious", oDiv2).click(this._delegate_click_showPage);
		jq("#pageNext", oDiv2).click(this._delegate_click_showPage);
		jq("#pageLast", oDiv2).click(this._delegate_click_showPage);
		jq("#feedback", oDiv2).click(this._delegate_click_feedback);
	}

	

	//clear old articles
	function __autotrack_clearoldarticles(nArticleIndex) {
		var nArticleIndexOld = nArticleIndex - 10;
		if (nArticleIndexOld >= 1) {
			cbase.sendmessage("clearArticleComments", nArticleIndexOld, function () {
			});
		}
	}

	function __switchcomments(oEntity) {
		//switch show
		var bVisible = this._getcommentscontainervisible(oEntity);
		if (bVisible) {
			//2011.01.05 check the position
			if (this._checkcommentsbuttoncontainerposition(oEntity)) {
				//top
				//not forcetryconfig
				this._tryconfigAndShow(oEntity, false, true);
			}
			else {
				//hide
				this._setcommentscontainervisible(oEntity, false);
			}
		}
		else {
			//not forcetryconfig
			this._tryconfigAndShow(oEntity, false, true);
		}
	}

	//
	function __pimshell_click_showComments(event) {
		//important, avoid raise twice
		event.stopPropagation();

		//
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//
		if (event.shiftKey || event.ctrlKey) {
			//url
			var sURL = cbase.getURL("addons/content/viewcomments.htm");
			sURL = ctools.appendQueryStringValue(sURL, "platform", cbase.getPlatform());
			sURL = ctools.appendQueryStringValue(sURL, "title", oEntity["articleTitle"]);
			sURL = ctools.appendQueryStringValue(sURL, "url", oEntity["articleLink"]);
			sURL = ctools.appendQueryStringValue(sURL, "formId", oEntity["formId"]);
			//open
			cbase.sendmessage("newTab", { url: sURL, active: event.shiftKey }, function () { });
		}
		else {
			//switch
			this._switchcomments(oEntity);
		}
	}

	//
	function __pimshell_click_feedback(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//always use articlelink
		var oParams = new Object();
		oParams["title"] = oEntity["articleTitle"];
		oParams["url"] = oEntity["articleLink"];
		oParams["formId"] = oEntity["formId"];
		
		//
		cbase.sendmessage("formFeedback", oParams, function () { });
	}

	//
	function __pimshell_click_requestForm(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//
		var oParams = new Object();
		if (oEntity["formStep"] == "article") {
			oParams["title"] = oEntity["articleTitle"];
			oParams["url"] = oEntity["articleLink"];
		}
		else {
			oParams["title"] = oEntity["feedTitle"];
			oParams["url"] = oEntity["feedLink"];
		}

		cbase.sendmessage("formWant", oParams, function () { });
	}

	function __pimshell_click_checkAgain(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//check if exists
		var oDiv = this._getcommentscontainer(oEntity, false);
		if (oDiv == null) {
			//may be cleared.
			return;
		}

		//clear comments
		oDiv.innerHTML = "";
		oEntity["_ready"] = false;

		//try config again
		this._tryconfigAndShow(oEntity, true,true);
	}

	//return true if below to the parent
	function __checkcommentsbuttoncontainerposition(oEntity) {
		//
		var oSpan1 = this._getcommentsbuttonscontainer(oEntity, false);
		if (oSpan1 == null) {
			return false;
		}

		//
		var oParentScrollContainer = this._getparentscrollcontainer(oEntity);
		if (oParentScrollContainer == null)
			return false; //ignore

		//
		var b = jq(oSpan1).offset().top;
		var c = jq(oParentScrollContainer).offset().top;

		var h = jq(oParentScrollContainer).height();
		return b >= h + c;
	}

	function __getparentscrollcontainer(oEntity) {
		//raise event of ongetparentscrollcontainer
		var oParentScrollContainer = null;

		var oEvent = this._createevent();
		oEvent.articleElement = oEntity["articleElement"];

		this._fireevent("ongetparentscrollcontainer", oEvent);
		if (oEvent.cancelBubble) {
			oParentScrollContainer = oEvent.returnValue;
		}

		return oParentScrollContainer;
	}

	function __forceshowcommentscontainer(oEntity, oCallback) {
		//
		var sFormId = oEntity["formId"];
		var bCheckStatus = oEntity["checkStatus"];

		//		force show comments
		if (bCheckStatus !== false && sFormId != "") {
			var oDiv2 = this._autotrack_gettrackcontainer(oEntity, true);
		}

		//		to top
		var oSpan1 = this._getcommentsbuttonscontainer(oEntity, false);
		if (oSpan1 == null) {
			oCallback(null);
			return;
		}

		//raise event of ongetparentscrollcontainer
		var oParentScrollContainer = this._getparentscrollcontainer(oEntity);
		if (oParentScrollContainer == null) {
			oSpan1.scrollIntoView();

			oCallback(null);
			return;
		}
		else {
			var a = jq(oParentScrollContainer).scrollTop();
			var b = jq(oSpan1).offset().top;
			var c = jq(oParentScrollContainer).offset().top;

			//-2 for top border
			//2010.01.05 -20 避免“展开模式”下show/hide时跳到下一个条目（不起作用）
			jq(oParentScrollContainer).animate({ scrollTop: a + b - c - 2  }, "normal", null, function () {
				oCallback(null);
				return;
			});
		}
	}

	
	function __pimshell_click_followComments(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//
		var oParams = new Object();
		oParams["articleTitle"] = oEntity["articleTitle"];
		oParams["articleLink"] = oEntity["articleLink"];
		oParams["feedTitle"] = oEntity["feedTitle"];
		oParams["feedLink"] = oEntity["feedLink"];
		oParams["formId"] = oEntity["formId"];

		cbase.sendmessage("followComments", oParams, function (oResult) {
			if (oResult === true) {
				window.alert(cbase.getlanguagevalue("hasFollowedAlert"));
			}
		});
	}

	function __pimshell_click_showOrder(event) {
		var oThis = this;

		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//
		var oDiv2 = oThis._autotrack_gettrackcontainer(oEntity, false);
		if (oDiv2 == null)
			return;

		//
		var sShowOrderNew = (oEntity["showOrder"] == "desc") ? "" : "desc";
		oEntity["showOrder"] = sShowOrderNew;

		var sBKImageURL=String2.format("{0}",sShowOrderNew == "desc" ? cbase.getURL("addons/images/down.gif") : cbase.getURL("addons/images/up.gif"));
		jq("#pimshell_advancedcomments_autotrack_toolbar #showOrder", oDiv2).attr('src', sBKImageURL);
		
		//
		cbase.sendmessage("changeShowOrder", sShowOrderNew, function () {
			oThis._autotrack_parsepage(oEntity, 1,true);
		});
	}

	function __getCurrentArticleEntity(){
		var nIndex=this.getCurrentArticleIndex();
		if(nIndex==0)
			return null;
		else
			return this._oMapForArticles[nIndex];
	}

	function __getCurrentArticleIndex() {
		return this._nCurrentArticleIndex;
	}

	function __refreshCurrentArticleCommentsOuter() {
		//current index
		var nIndex = this.getCurrentArticleIndex();
		if (nIndex == 0)
			return;

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		//refresh the current aritcle's info
		//raise event of ongetcurrentarticle
		var oEvent = this._fire_ongetcurrentarticle();
		if (oEvent.returnValue === true) {
			oEntity["articleElement"] = oEvent["articleElement"];
			oEntity["articleLink"] = oEvent["articleLink"];
			oEntity["articleTitle"] = oEvent["articleTitle"];

			oEntity["feedElement"] = oEvent["feedElement"];
			oEntity["feedLink"] = oEvent["feedLink"];
			oEntity["feedTitle"] = oEvent["feedTitle"];

			oEntity["formId"] = oEvent["formId"];
		}

		//
		this.refreshArticleComments(nIndex);
	}

	function __refreshArticleComments(nIndex) {
		var oThis = this;

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		cbase.sendmessage("clearArticleComments", nIndex, function () {
			oThis._autotrack_parsepage(oEntity, 1, true);
		});
	}

	function __pimshell_click_refresh(event) {
		var oThis = this;

		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		oThis.refreshArticleComments(nIndex);
	}

	function __pimshell_click_showPage(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");
		var sName = oElement.getAttribute("id");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		var oDiv2 = this._autotrack_gettrackcontainer(oEntity, false);
		if (oDiv2 == null)
			return;

		//info
		var oPageInfo = jq("#pimshell_advancedcomments_autotrack_pager #pageInfo", oDiv2);
		var nPageIndex = ctools.adjustvalue( jq("#pageIndex", oPageInfo).text(),-1);
		var nPageCount = ctools.adjustvalue(jq("#pageCount", oPageInfo).text(), -1);

		var nReady = nPageCount != -1 && nPageIndex != -1;
		if (!nReady)
			return;

		//get pageindexnew
		var nPageIndexNew = -1;

		if (sName == "pageFirst") {
			if (nPageIndex > 1)
				nPageIndexNew = 1;
		}
		else if (sName == "pagePrevious") {
			if (nPageIndex > 1)
				nPageIndexNew = nPageIndex - 1;
		}
		else if (sName == "pageNext") {
			if (nPageIndex < nPageCount)
				nPageIndexNew = nPageIndex + 1;
		}
		else if (sName == "pageLast") {
			if (nPageIndex < nPageCount)
				nPageIndexNew = nPageCount;
		}

		//show
		if (nPageIndexNew != -1) {
			if (nPageIndexNew >= 1 && nPageIndexNew <= nPageCount) {
				//parse page
				this._autotrack_parsepage(oEntity, nPageIndexNew, true);
			}
		}
	}

	//adjust returnvalue
	function __adjustreturnvalue(oEvent, vhr) {
		if (vhr != null) {
			oEvent.returnValue = vhr;
		}
	}

	//fire event call
	function __fireevent_call(oEventsClass, sEventName, oEvent) {
		if (oEventsClass != null) {
			var oEventMethod = oEventsClass[sEventName];
			if (oEventMethod) {
				var vhr = oEventMethod.call(oEventsClass, oEvent);
				this._adjustreturnvalue(oEvent, vhr);

				if (oEvent.cancelBubble)
					return false;
			}
		}

		return true;
	}

	//fire event
	function __fireevent(sEventName, oEvent, bNormalFirst) {
		//system first
		if (bNormalFirst != null && bNormalFirst == false) {
			if (!this._fireevent_call(this._events_system, sEventName, oEvent))
				return;
		}

		//normal
		if (!this._fireevent_call(this._events, sEventName, oEvent))
			return;

		//system last
		if (bNormalFirst == null || bNormalFirst == true) {
			if (!this._fireevent_call(this._events_system, sEventName, oEvent))
				return;
		}
	}

	//create event
	function __createevent() {
		var oEvent = new Object();

		oEvent.returnValue = null;
		oEvent.cancelBubble = false;

		return oEvent;
	}

}

////	General Tools -- end	
///////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////
////	Reader Online Events -- begin

////		-- variables

////		-- class
function feed_readerOnline_events_system(window, document, jq) {

	////	-- methods
	this.initialize = __initialize;
	this.dispose = __dispose;

	//		-- functions

	//dispose
	function __dispose() {
		
	}

	//initialize
	function __initialize() {
	}
}

////	Reader Online Events -- end	
///////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////
////	All Events -- begin

//1.
//	name:			ongetcurrentarticle
//	attributes:		
//					articleElement
//					articleLink
//					articleTitle
//	returnValue:	if succeeded then return true

//2.
//	name:			ongetcommentscontainer
//	attributes:		
//					articleElement
//	returnValue:	return commentscontainer (allow null)
//	cancelBubble:	if succeeded then return true

//3.
//	name:			onappendcommentscontainer
//	attributes:		
//					articleElement
//					commentscontainer
//	cancelBubble:	if succeeded then return true

//4.
//	name:			oncommentscontainerready
//	attributes:		
//					articleElement
//					commentscontainer
//					entity

//5.
//	name:			ongetoption
//	attributes:		
//					name
//					value
//	returnValue:	return option value
//	cancelBubble:	if succeeded then return true

////	All Events -- end	
///////////////////////////////////////////////////////////////
