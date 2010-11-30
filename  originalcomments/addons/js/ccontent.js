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
	this._getcommentscontainer = __getcommentscontainer;
	this._setcomments = __setcomments;

	//2010.08.03
	this._autotrack_getcommentsparams_trackurl = __autotrack_getcommentsparams_trackurl;
	this._autotrack_gettrackcontainer = __autotrack_gettrackcontainer;
	this._autotrack_gettrackcontainervisible = __autotrack_gettrackcontainervisible;
	this._autotrack_enabled = __autotrack_enabled;
	this._autotrack_height = __autotrack_height;
	this._autotrack_leftmargin = __autotrack_leftmargin;
	this._autotrack_rightmargin = __autotrack_rightmargin;
	this._autotrack_showorder=__autotrack_showorder;
	this._autotrack_clearoldarticles = __autotrack_clearoldarticles;
	this._autotrack_createcontentparts = __autotrack_createcontentparts;
	this._autotrack_parsepage = __autotrack_parsepage;
	this._forceshowcommentscontainer = __forceshowcommentscontainer;

	this._currentArticleIndexChanged = __currentArticleIndexChanged;

	//
	
	this._createevent = __createevent;
	this._fireevent = __fireevent;
	this._fireevent_call = __fireevent_call;
	this._adjustreturnvalue = __adjustreturnvalue;

	//delegate
	this._delegate_click_feedback = null;
	this._delegate_click_requestForm = null;
	this._delegate_click_checkAgain = null;
	this._delegate_click_trackComments = null;
	this._delegate_click_followComments = null;
	this._delegate_click_showOrder = null;
	this._delegate_click_refresh = null;
	this._delegate_click_showPage = null;

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
		//
		this._oMapForArticles = new Object();
		this._oMapForFeeds = new Object();

		//
		this._setglobalfunctions(true);

		//
		this._createAdvancedComments(true);

		//
		this._createtimer(true);
	}

	function __setglobalfunctions(bSet) {
		if (bSet) {
			this._delegate_click_feedback = ctools.createDelegate(this, __pimshell_click_feedback);
			this._delegate_click_requestForm = ctools.createDelegate(this, __pimshell_click_requestForm);
			this._delegate_click_checkAgain = ctools.createDelegate(this, __pimshell_click_checkAgain);
			this._delegate_click_trackComments = ctools.createDelegate(this, __pimshell_click_trackComments);
			this._delegate_click_followComments = ctools.createDelegate(this, __pimshell_click_followComments);
			this._delegate_click_showOrder = ctools.createDelegate(this, __pimshell_click_showOrder);
			this._delegate_click_refresh = ctools.createDelegate(this, __pimshell_click_refresh);
			this._delegate_click_showPage = ctools.createDelegate(this, __pimshell_click_showPage);
		}
		else {
			this._delegate_click_feedback = null;
			this._delegate_click_requestForm = null;
			this._delegate_click_checkAgain = null;
			this._delegate_click_trackComments = null;
			this._delegate_click_followComments = null;
			this._delegate_click_showOrder = null;
			this._delegate_click_refresh = null;
			this._delegate_click_showPage = null;
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

	function __interval_callback() {
		try {
			//get the current aritcle
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
						nIndex=++this._nArticleCounter;
						oArticleElement.setAttribute('_index_oc', nIndex);
					}

					//
					var oDiv = this._getcommentscontainer(oArticleElement, false);
					if (nIndex != this._nCurrentArticleIndex || oDiv == null) {
						var nIndexOld = this._nCurrentArticleIndex;
						this._nCurrentArticleIndex = nIndex;
						this._currentArticleIndexChanged(nIndexOld, this._nCurrentArticleIndex, oEvent);
					}
				}
			}
		}
		catch (e) {
			//donnot raise any error.
		}
	}

	function __getcommentscontainer(oArticleElement, bCreateIfEmpty) {
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
				oDiv.setAttribute('_ready', false);
				oDiv.style.cssText='font-size:12px;margin-left:30px;margin-top:10px;margin-bottom:20px;margin-right:5px;border:solid 1px gray;padding-left:12px;padding-top:5px;padding-bottom:5px;padding-right:5px;';

				//raise event of onappendcommentscontainer
				var oEvent = this._createevent();
				oEvent.articleElement = oArticleElement;
				oEvent.commentscontainer = oDiv;

				this._fireevent("onappendcommentscontainer", oEvent);
				if (!oEvent.cancelBubble) {
					oArticleElement.appendChild(oDiv);
				}

				//2010.11.20 clear old articles
				var nIndex = ctools.getAttribute(oArticleElement, "_index_oc", 0);
				this._autotrack_clearoldarticles(nIndex);
			}
		}

		return oDiv;
	}

	function __currentArticleIndexChanged(nIndexOld, nIndexNew, oEvent) {
		//
		this._tryconfig(oEvent, false);
	}

	function __tryconfig(oParams, bForceTry) {
		var oThis = this;

		//article
		var oArticleElement = oParams["articleElement"];
		var sArticleLink = oParams["articleLink"];
		var sArticleTitle = oParams["articleTitle"];
		var sFormId = oParams["formId"];

		//feed
		var oFeedElement = oParams["feedElement"];
		var sFeedLink = oParams["feedLink"];
		var sFeedTitle = oParams["feedTitle"];

		//check if exists
		var oDiv = this._getcommentscontainer(oArticleElement, true);
		if (oDiv == null)
			return;

		//check ready
		var bReady = ctools.getAttribute(oDiv, "_ready", false);
		if (bReady && !bForceTry)
			return;

		//check if exsits
		var nIndex = ctools.getAttribute(oArticleElement, "_index_oc", 0);
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null) {
			oEntity = new Object();
			oEntity["index"] = nIndex;
			oEntity["articleElement"] = oArticleElement;
			oEntity["articleLink"] = sArticleLink;
			oEntity["articleTitle"] = sArticleTitle;

			oEntity["feedElement"] = oFeedElement;
			oEntity["feedLink"] = sFeedLink;
			oEntity["feedTitle"] = sFeedTitle;

			oEntity["formId"] = sFormId;

			this._oMapForArticles[nIndex] = oEntity;
		}

		if (!String2.isEmpty(oEntity["formId"])) {
			oThis._setcomments(oEntity, true);
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

			cbase.sendmessage("commentsCheck", oTmp, function (oParams) {
				oEntity["formId"] = oParams["formId"];
				oEntity["formStep"] = oParams["formStep"];
				oThis._setcomments(oEntity, oParams["succeeded"]);
			});
		}
	}

	
	//
	function __setcomments(oEntity, bSucceeded) {
		//info
		var oArticleElement = oEntity["articleElement"];
		var sFormId = oEntity["formId"];
		var nIndex = oEntity["index"];

		//check if exists
		var oDiv = this._getcommentscontainer(oArticleElement, false);
		if (oDiv == null) {
			//may be cleared.
			return;
		}

		//
		var sHtml_Comment = "";
		if (bSucceeded) {
			if (sFormId == "") {
				sHtml_Comment = String2.format("<div>\
										<img src='{3}' style='margin-right:4px;' /><span id='cmd_requestForm' _index='{0}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{1}'>{2}</span>\
										</div>",
										nIndex,
										cbase.getlanguagevalue("requestFormTitle"),
										cbase.getlanguagevalue("requestFormTitle"),
										cbase.getURL("addons/images/originalcomments_n.ico")
										);
			}
			else {
				sHtml_Comment = String2.format("<div>\
									<img src='{5}' id='cmd_trackComments_img' style='margin-right:4px;' /><span id='cmd_trackComments' _index='{0}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{1}'>{2}</span>\
									<img src='{5}' id='cmd_followComments_img' style='margin-right:4px;' /><span id='cmd_followComments' _index='{0}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{3}'>{4}</span>\
									</div>",
									nIndex,
									cbase.getlanguagevalue("trackCommentsDesp").replace(/\"/g, "&quot;"),
									cbase.getlanguagevalue("track"),
									cbase.getlanguagevalue("followCommentsDesp").replace(/\"/g, "&quot;"),
									cbase.getlanguagevalue("follow"),
									cbase.getURL("addons/images/originalcomments_y.ico")
									);
			}
		}
		else {
			sHtml_Comment = String2.format("<div>\
										<img src='{3}' style='margin-right:4px;' /><span id='cmd_checkAgain' _index='{0}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{1}'>{2}</span>\
										</div>",
										nIndex,
										cbase.getlanguagevalue("checkagain"),
										cbase.getlanguagevalue("checkagain"),
										cbase.getURL("addons/images/originalcomments.ico")
										);
		}

		//set html
		oDiv.innerHTML = sHtml_Comment;
		oDiv.setAttribute("_ready", true);

		//events
		jq("#cmd_requestForm", oDiv).click(this._delegate_click_requestForm);
		jq("#cmd_trackComments", oDiv).click(this._delegate_click_trackComments);
		jq("#cmd_followComments", oDiv).click(this._delegate_click_followComments);
		jq("#cmd_checkAgain", oDiv).click(this._delegate_click_checkAgain);

		//raise event of oncommentscontainerready
		var oEvent = this._createevent();
		oEvent.articleElement = oArticleElement;
		oEvent.commentscontainer = oDiv;
		oEvent.entity = oEntity;

		this._fireevent("oncommentscontainerready", oEvent);

		//2010.08.03
		if (this._autotrack_enabled()) {
			if (bSucceeded && sFormId != "") {
				var oDiv2 = this._autotrack_gettrackcontainer(oEntity, true);
			}
		}
	}

	function __autotrack_enabled() {
		return this._oContent.m_oOptions["autoview_enabled"];
	}

	function __autotrack_height() {
		return this._oContent.m_oOptions["autoview_height"];
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

	function __autotrack_gettrackcontainervisible(oEntity) {
		var oDiv2 = this._autotrack_gettrackcontainer(oEntity, false);
		if (oDiv2 == null)
			return false;
		else
			return oDiv2.style.display != "none";
	}

	function __autotrack_gettrackcontainer(oEntity, bCreateIfEmpty) {
		var oArticleElement = oEntity["articleElement"];

		var oDiv = this._getcommentscontainer(oArticleElement, false);
		if (oDiv == null)
			return null;

		var oDiv2 = ctools.getFirstJQElement(jq("#pimshell_advancedcomments_autotrack", oDiv));
		if (oDiv2 == null) {
			if (bCreateIfEmpty) {
				//oDiv2
				oDiv2 = document.createElement("div");

				oDiv2.id = 'pimshell_advancedcomments_autotrack';
				oDiv2.style.cssText = String2.format('height:{0}px;padding-top:10px;padding-bottom:0px;padding-right:{1}px;padding-left:{2}px;',
												parseInt(this._autotrack_height()) + 75,
												this._autotrack_rightmargin(),this._autotrack_leftmargin());

				oDiv.appendChild(oDiv2);

				//prepare showorder ,even if recreate commentscontainer again.
				//	before _autotrack_createcontentparts
				oEntity["showOrder"]=this._autotrack_showorder();

				//content parts
				this._autotrack_createcontentparts(oDiv2, oEntity);

				//parse page one
				this._autotrack_parsepage(oEntity, 1,false);
			}
		}

		//
		return oDiv2;
	}

	function __autotrack_parsepage(oEntity, nPageIndex,bForceTop) {
		var oThis = this;

		//
		var oDiv2 = oThis._autotrack_gettrackcontainer(oEntity, false);
		if (oDiv2 == null)
			return;

		//loading
		jq("#pimshell_advancedcomments_autotrack_toolbar #loading", oDiv2).show();

		//params
		var oParams = new Object();
		oParams["pageIndex"] = nPageIndex;
		oParams["showOrder"] = oEntity["showOrder"];
		oParams["articleLink"] = oEntity["articleLink"];
		oParams["articleTitle"] = oEntity["articleTitle"];
		oParams["formId"] = oEntity["formId"];
		oParams["articleIndex"] = oEntity["index"];
			
		//
		cbase.sendmessage("showPage", oParams, function (oResult) {
			//do nothing
			if (oResult == null)
				return;

			//try get again
			var oDiv2 = oThis._autotrack_gettrackcontainer(oEntity, false);
			if (oDiv2 == null)
				return;

			//loading
			jq("#pimshell_advancedcomments_autotrack_toolbar #loading", oDiv2).hide();

			//if failed donnot change anything
			if (oResult["status"] != "succeeded")
				return;

			//page info
			var nTotalCount = oResult["totalcount"];
			var nPageCount = oResult["pagecount"];
			var nPageSize = oResult["pagesize"];

			//content
			jq("#pimshell_advancedcomments_autotrack_content", oDiv2).html(oResult["content"]).attr('scrollTop', 0);

			//2010.11.22 just scrollIntoView
			if (bForceTop) {
				oThis._forceshowcommentscontainer(oEntity);
			}

			//toolbar
			var oPageInfo = jq("#pimshell_advancedcomments_autotrack_toolbar #pageInfo", oDiv2);
			oPageInfo.show();
			jq("#pageIndex", oPageInfo).text(nPageIndex);
			jq("#pageCount", oPageInfo).text(nPageCount);
			jq("#totalCount", oPageInfo).text(nTotalCount);

			//pager
			var oPager = jq("#pimshell_advancedcomments_autotrack_pager", oDiv2);
			jq("#pageFirst", oPager).attr('src',
										nPageIndex <= 1 ? cbase.getURL("addons/images/page-first-disabled.gif") : cbase.getURL("addons/images/page-first.gif"));
			jq("#pagePrevious", oPager).attr('src',
										nPageIndex <= 1 ? cbase.getURL("addons/images/page-prev-disabled.gif") : cbase.getURL("addons/images/page-prev.gif"));
			jq("#pageNext", oPager).attr('src',
										nPageIndex >= nPageCount ? cbase.getURL("addons/images/page-next-disabled.gif") : cbase.getURL("addons/images/page-next.gif"));
			jq("#pageLast", oPager).attr('src',
										nPageIndex >= nPageCount ? cbase.getURL("addons/images/page-last-disabled.gif") : cbase.getURL("addons/images/page-last.gif"));


		});	
	}


	//
	function __autotrack_createcontentparts(oDiv2, oEntity) {

		//
		var nIndex = oEntity["index"];
		var sShowOrder = oEntity["showOrder"];

		//toolbar
		var oToolbar = document.createElement("div");
		oToolbar.id = 'pimshell_advancedcomments_autotrack_toolbar';
		oToolbar.style.cssText = "height:25px;";
		oDiv2.appendChild(oToolbar);

		var sHtml_Toolbar = String2.format("\
									<img id='loading' src='{1}' style='display:none;' />\
									<img id='showOrder' _index='{0}' src='{2}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{3}' />\
									<img id='refresh' _index='{0}' src='{4}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title='{5}' />\
									<span id='pageInfo' style='vertical-align:top;display:none;margin-right:4px;'><span id='pageIndex' style='vertical-align:top;color:#5377A9;'></span>/<span id='pageCount' style='vertical-align:top;'></span>(<span id='totalCount' style='vertical-align:top;color:#5377A9;'></span>)</span>\
									<a href='{6}' target='_blank'><img border='0' src='{7}' /></a>\
									",
									nIndex,
									cbase.getURL("addons/images/loading.gif"),
									sShowOrder == "desc" ? cbase.getURL("addons/images/down.gif") : cbase.getURL("addons/images/up.gif"),
									cbase.getlanguagevalue("ascdesc"),
									cbase.getURL("addons/images/refresh.ico"),
									cbase.getlanguagevalue("refresh"),
									ctools.HTMLEncode(oEntity["articleLink"]),
									cbase.getURL("addons/images/goto.gif")
									);

		oToolbar.innerHTML = sHtml_Toolbar;

		jq("#showOrder", oToolbar).click(this._delegate_click_showOrder);
		jq("#refresh", oToolbar).click(this._delegate_click_refresh);

		//content
		var oContent = document.createElement("div");
		oContent.id = 'pimshell_advancedcomments_autotrack_content';
		oContent.style.cssText = String2.format('height:{0}px;border:solid 1px gray;overflow-y:auto;',
													this._autotrack_height());
		oDiv2.appendChild(oContent);

		//pager
		var oPager = document.createElement("div");
		oPager.id = 'pimshell_advancedcomments_autotrack_pager';
		oPager.style.cssText = "height:25px;";
		oDiv2.appendChild(oPager);

		//
		var sHtml_Pager = String2.format("<div style='margin-top:4px;'>\
									<img id='pageFirst' _index='{0}' src='{1}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title=\"{2}\" />\
									<img id='pagePrevious' _index='{0}' src='{3}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title=\"{4}\" />\
									<img id='pageNext' _index='{0}' src='{5}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title=\"{6}\" />\
									<img id='pageLast' _index='{0}' src='{7}' unselectable='on' onselectstart='return false;' style='-moz-user-select:none;margin-right:4px;color:blue;cursor:pointer;' title=\"{8}\" />\
									</div>\
									<div style='margin-top:4px;'><span id='feedback' _index='{0}' style='cursor:pointer;color:Green; font-weight:bold;'>* {9}</span></div>\
									",
									nIndex,
									cbase.getURL("addons/images/page-first-disabled.gif"),
									cbase.getlanguagevalue("pageFirst"),
									cbase.getURL("addons/images/page-prev-disabled.gif"),
									cbase.getlanguagevalue("pagePrevious"),
									cbase.getURL("addons/images/page-next-disabled.gif"),
									cbase.getlanguagevalue("pageNext"),
									cbase.getURL("addons/images/page-last-disabled.gif"),
									cbase.getlanguagevalue("pageLast"),
									cbase.getlanguagevalue("viewcommentfeedbackprompt")
									);

		oPager.innerHTML = sHtml_Pager;

		jq("#pageFirst", oPager).click(this._delegate_click_showPage);
		jq("#pagePrevious", oPager).click(this._delegate_click_showPage);
		jq("#pageNext", oPager).click(this._delegate_click_showPage);
		jq("#pageLast", oPager).click(this._delegate_click_showPage);
		jq("#feedback", oPager).click(this._delegate_click_feedback);
	}

	

	//clear old articles
	function __autotrack_clearoldarticles(nArticleIndex) {
		var nArticleIndexOld = nArticleIndex - 10;
		if (nArticleIndexOld >= 1) {
			cbase.sendmessage("clearArticleComments", nArticleIndexOld, function () {
			});
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
		var oArticleElement=oEntity["articleElement"];
		var oDiv = this._getcommentscontainer(oArticleElement, false);
		if (oDiv == null) {
			//may be cleared.
			return;
		}

		//clear comments
		oDiv.innerHTML = "";
		oDiv.setAttribute("_ready", false);

		//try config again
		this._tryconfig(oEntity, true);
	}

	function __forceshowcommentscontainer(oEntity) {
		//		force show comments
		var oDiv2 = this._autotrack_gettrackcontainer(oEntity, true);
		//		to top
		var oDiv = this._getcommentscontainer(oEntity["articleElement"], false);
		if (oDiv != null) {
			oDiv.scrollIntoView();
		}
	}

	//
	function __pimshell_click_trackComments(event) {
		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity != null) {

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
				//2010.11.20 just scrollIntoView
				this._forceshowcommentscontainer(oEntity);

				/*
				//switch
				if (this._autotrack_gettrackcontainervisible(oEntity)) {
					var oDiv2 = this._autotrack_gettrackcontainer(oEntity, false);
					oDiv2.style.display = "none";
				}
				else {
					var oDiv2 = this._autotrack_gettrackcontainer(oEntity, true);
					if (oDiv2 != null) {
						oDiv2.style.display = "block";

						//2010.08.06 top
						var oDiv = this._getcommentscontainer(oEntity["articleElement"], false);
						if (oDiv != null) {
							oDiv.scrollIntoView();
						}
					}
				}*/
			}

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
		jq("#pimshell_advancedcomments_autotrack_toolbar #showOrder", oDiv2).attr('src', sShowOrderNew == "desc" ? cbase.getURL("addons/images/down.gif") : cbase.getURL("addons/images/up.gif"));
		
		//
		cbase.sendmessage("changeShowOrder", sShowOrderNew, function () {
			oThis._autotrack_parsepage(oEntity, 1,true);
		});
	}

	function __pimshell_click_refresh(event) {
		var oThis = this;

		var oElement = ctools.getEventElement(event);
		var nIndex = oElement.getAttribute("_index");

		//
		var oEntity = this._oMapForArticles[nIndex];
		if (oEntity == null)
			return;

		cbase.sendmessage("clearArticleComments", nIndex, function () {
			oThis._autotrack_parsepage(oEntity, 1, true);
		});

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
		var oPageInfo = jq("#pimshell_advancedcomments_autotrack_toolbar #pageInfo", oDiv2);
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


////	All Events -- end	
///////////////////////////////////////////////////////////////
