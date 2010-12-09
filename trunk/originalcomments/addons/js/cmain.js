/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/

/// <reference path="cbase.js" />
/// <reference path="ctools.js" />
/// <reference path="cpage.js" />


var URL_Feed_FormMatch="http://www.pimshell.com/formgallery/FormMatch.aspx";
var URL_Feed_FormDownload="http://www.pimshell.com/formgallery/Download.aspx";
var URL_Feed_ClientCheck="http://www.pimshell.com/formgallery/ClientCheck.aspx";
var URL_Feed_FormWant="http://www.pimshell.com/formgallery/Want.aspx";
var URL_Feed_FormFeedback="http://www.pimshell.com/formgallery/Feedback.aspx";
var URL_Feed_FormCheck="http://www.pimshell.com/formgallery/FormCheck.aspx";

/*
var URL_Feed_FormMatch = "http://localhost:49448/FormMatch.aspx";
var URL_Feed_FormDownload = "http://localhost:49448/test/Download.aspx";
var URL_Feed_ClientCheck = "http://localhost:49448/ClientCheck.aspx";
var URL_Feed_FormWant = "http://localhost:49448/Want.aspx";
var URL_Feed_FormFeedback = "http://localhost:49448/Feedback.aspx";
var URL_Feed_FormCheck = "http://localhost:49448/FormCheck.aspx";
*/

//

function createMainContext(window, document, jq) {

	//
	var cmain = {
		//properties
		m_oMapTabContent: {},

		m_oFormManager: null,
		m_oFeedLinkFormManager: null,
		m_oFollowManager: null,

		m_sClientId: "",

		m_oDataOptions: null,

		//method
		start: function () {
			var oThis = this;

			//
			oThis.m_oFormManager = new CFormManager(oThis);
			oThis.m_oFeedLinkFormManager = new CFeedLinkFormManager(oThis);

			oThis.m_oFollowManager = new CFollowManager(oThis);
			oThis.m_oFollowManager.init();

			// main callback
			cbase.onreceivemessage(ctools.createDelegate(oThis, oThis._onreceivemessage));

			//	unload
			window.addEventListener("unload", ctools.createDelegate(oThis, oThis._onunload), false);
		},

		//	unload
		_onunload: function () {
			var oThis = this;

			//
			oThis.m_oMapTabContent = null;
			oThis.m_oFormManager = null;
			oThis.m_oFeedLinkFormManager = null;
			oThis.m_oFollowManager = null;

			//
			cbase.onreceivemessage_u();
		},

		_saveDataOptions: function (oOptions) {
			this.m_oDataOptions = oOptions;
			cbase.setoption("options", oOptions);

			//to all clients
			for (var sTabGuid in this.m_oMapTabContent) {
				cbase.sendmessagetab(parseInt(sTabGuid), "optionsChanged", oOptions, function () { });
			}
		},

		_fillDataOptions: function (oOptions) {
			//for extensible
			if (oOptions["autoview_enabled"] == null)
				oOptions["autoview_enabled"] = true;
			if (oOptions["autoview_height"] == null)
				oOptions["autoview_height"] = 300;
			if (oOptions["autoview_leftmargin"] == null)
				oOptions["autoview_leftmargin"] = 100;
			if (oOptions["autoview_rightmargin"] == null)
				oOptions["autoview_rightmargin"] = 100;
			if (oOptions["autoview_showorder"] == null)
				oOptions["autoview_showorder"] = "";
			if (oOptions["follow_checkenabled"] == null)
				oOptions["follow_checkenabled"] = true;
			if (oOptions["follow_checkinterval"] == null)
				oOptions["follow_checkinterval"] = 60; //minutes

			//ok
			return oOptions;
		},

		_getDataOptions: function () {
			if (this.m_oDataOptions == null) {
				var oOptions = cbase.getoption("options", null);
				if (oOptions == null) {
					oOptions = new Object();
				}

				//for extensible
				this._fillDataOptions(oOptions);

				//ready
				this.m_oDataOptions = oOptions;
			}

			return this.m_oDataOptions;
		},

		//	main callback
		_onreceivemessage: function (actionname, params, tabguid, onresponse) {
			try {
				this._onreceivemessage2(actionname, params, tabguid, onresponse);
			} catch (e) {
				if (actionname == "showPage") {
					onresponse({ status: "failed" });
				}
				else {
					onresponse(null);
				}
			}
		},
		_onreceivemessage2: function (actionname, params, tabguid, onresponse) {
			var oThis = this;

			if (actionname == "register") {
				oThis.m_oMapTabContent[tabguid] = new Object();
				onresponse(true);
			}
			else if (actionname == "unregister") {
				delete oThis.m_oMapTabContent[tabguid];
				onresponse(null);
			}
			else if (actionname == "getOptions") {
				var oOptions = this._getDataOptions();
				onresponse(oOptions);
			}
			else if (actionname == "saveOptions") {
				this._saveDataOptions(params);
				onresponse(null);
			}
			else if (actionname == "loadDefaultOptions") {
				onresponse(this._fillDataOptions(new Object()));
			}
			else if (actionname == "changeShowOrder") {
				//save
				var oOptions = this._getDataOptions();
				oOptions["autoview_showorder"] = params;

				this._saveDataOptions(oOptions);

				//ok
				onresponse(null);
			}
			else if (actionname == "commentsCheck") {
				oThis.m_oFeedLinkFormManager._commentsCheck(params, onresponse);
			}
			else if (actionname == "showPage") {
				var oContentManger = oThis._getContentManager(tabguid);
				oContentManger.showPageOuter(params, onresponse);
			}
			else if (actionname == "clearArticleComments") {
				var oContentManger = oThis._getContentManager(tabguid);
				oContentManger.clearArticleComments(params, onresponse);
			}
			else if (actionname == "openRequest") {
				var sURL = params;
				XMLHttpManager.openRequest2(sURL, null, function (oRequest) {
					if (oRequest.status != 200) {
						onresponse({ succeeded: false, text: null });
					}
					else {
						onresponse({ succeeded: true, text: oRequest.responseText });
					}
				});
			}
			else if (actionname == "checkClient") {
				this._checkClient(params, onresponse);
			}
			else if (actionname == "formWant") {
				var oEntity = params;
				var sURL = ctools.appendQueryStringValue(URL_Feed_FormWant, 'Title', oEntity["title"]);
				sURL = ctools.appendQueryStringValue(sURL, 'URL', oEntity["url"]);

				cbase.newTab(sURL, true);
				onresponse(null);
			}
			else if (actionname == "formFeedback") {
				var oEntity = params;
				var sURL = ctools.appendQueryStringValue(URL_Feed_FormFeedback, 'Title', oEntity["title"]);
				sURL = ctools.appendQueryStringValue(sURL, 'URL', oEntity["url"]);
				sURL = ctools.appendQueryStringValue(sURL, 'FormId', oEntity["formId"]);

				cbase.newTab(sURL, true);
				onresponse(null);
			}
			else if (actionname == "newTab") {
				cbase.newTab(params["url"], params["active"]);
				onresponse(null);
			}
			else if (actionname == "followComments") {
				this.m_oFollowManager.followComments(params, onresponse);
			}
			else if (actionname == "unsubscribeComments") {
				this.m_oFollowManager.unsubscribeComments(params, onresponse);
			}
			else if (actionname == "getFollowCommentsStat") {
				this.m_oFollowManager.getFollowCommentsStat(onresponse);
			}
			else if (actionname == "getFollowCommentsContent") {
				this.m_oFollowManager.getFollowCommentsContent(params, onresponse);
			}
			else if (actionname == "clearFollowCommentsContent") {
				this.m_oFollowManager.clearFollowCommentsContent(params, onresponse);
			}
			else if (actionname == "checkFollowCommentsNow") {
				this.m_oFollowManager.checkFollowCommentsNow(onresponse);
			}
			else if (actionname == "getFollowCommentsAll") {
				this.m_oFollowManager.getFollowCommentsAll(onresponse);
			}
			else if (actionname == "debug_setform") {
				this.m_oFormManager.debug_setform(params, onresponse);
			}
		},

		_checkClient: function (sClientId, callback) {
			var oThis = this;

			this._checkClient2(sClientId, function (oResult) {
				//remove all empty record, so as to match form again.
				if (oResult != null) {
					oThis.m_oFeedLinkFormManager._removeAllEmptyRecords();
				}

				//callback
				callback(oResult);
			});
		},

		_checkClient2: function (sClientId, callback) {
			var oThis = this;

			if (String2.isEmpty(sClientId)) {
				//ok
				callback({ ready: true });
			}
			else if (this.m_sClientId == sClientId) {
				callback({ ready: true });
			}
			else {
				//
				var sURL = ctools.appendQueryStringValue(URL_Feed_ClientCheck, 'clientId', sClientId);
				XMLHttpManager.openRequest2(sURL, null, function (oRequest) {
					if (oRequest.status != 200) {
						callback(null);
					}
					else {
						//only save when succeeded
						oThis.m_sClientId = sClientId;
						callback({ ready: true });
					}
				});
			}
		},

		_getContentManager: function (tabguid) {
			var oTabContent = this.m_oMapTabContent[tabguid];
			if (oTabContent != null) {
				var oContentManger = oTabContent["contentManager"];
				if (oContentManger == null) {
					oContentManger = new CContentManager(this);
					oTabContent["contentManager"] = oContentManger;
				}
				return oContentManger;
			}

			return null;
		}

	};

	//
	return cmain;

	/////////////////////////////
	function CFollowManager(oMain) {
		//properties
		this.m_oMain = oMain;
		this.m_oMapFollows = null;
		this.m_oArrayChecking = new Array();
		this.m_oContentManager = null;

		this.m_nTimeoutId = 0;
		this.m_sArticleLinkParsing = "";

		//method
		this.init = function () {
			//contentmanager
			this.m_oContentManager = new CContentManager(this.m_oMain);

			//load
			this._loadFollows();

			//check notify
			this._checkNotify();

			//start check now
			if (this._getOption_CheckEnabled()) {
				this._startCheckNow();
			}
		};

		this.getFollowCommentsAll = function (callback) {
			//followComments
			var oFollowComments = new Array();

			for (var sArticleLink in this.m_oMapFollows) {
				var oFollowInfo = this.m_oMapFollows[sArticleLink];

				var oFollowInfo2 = new Object();
				oFollowInfo2["commentsCount"] = this._countComments(oFollowInfo);
				oFollowInfo2["articleLink"] = oFollowInfo["articleLink"];
				oFollowInfo2["articleTitle"] = oFollowInfo["articleTitle"];
				oFollowInfo2["feedLink"] = oFollowInfo["feedLink"];
				oFollowInfo2["createTime"] = oFollowInfo["createTime"];

				oFollowComments.push(oFollowInfo2);
			}

			//desc
			oFollowComments.sort(function (x, y) {
				var a = new Date(x["createTime"]);
				var b = new Date(y["createTime"]);
				return a == b ? 0 : (a > b ? -1 : 1);
			});

			//ok
			callback(oFollowComments);
		};

		this.checkFollowCommentsNow = function (callback) {
			this._startCheckNow();
			callback(null);
		};

		this.clearFollowCommentsContent = function (sArticleLink, callback) {
			var oFollowInfo = this.m_oMapFollows[sArticleLink];
			if (oFollowInfo != null) {
				oFollowInfo["data"] = null;
				this._saveFollows();
			}

			callback(null);
		};

		this.getFollowCommentsContent = function (sArticleLink, callback) {
			var oFollowInfo = this.m_oMapFollows[sArticleLink];
			if (oFollowInfo == null) {
				callback("");
			}
			else {
				var oEntityset = new CEntityset();
				oEntityset.setData(oFollowInfo["data"]);
				//var sContent = CArticleCommentsTools2.combineCommentsText(oEntityset.getCount(), oEntityset, "desc");
				var sContent = CArticleCommentsTools2.combineCommentsText(1, oEntityset, "");
				callback(sContent);
			}
		};

		this.getFollowCommentsStat = function (callback) {
			var oResult = new Object();

			//follow count
			oResult["followCount"] = ctools.getObjectLength(this.m_oMapFollows);

			//totalcount
			oResult["totalCount"] = this._countTotalComments();

			//followComments
			var oFollowComments = new Array();
			oResult["followComments"] = oFollowComments;

			for (var sArticleLink in this.m_oMapFollows) {
				var oFollowInfo = this.m_oMapFollows[sArticleLink];
				var oCount = this._countComments(oFollowInfo);
				if (oCount > 0) {
					oFollowComments.push(oFollowInfo);
				}
			}

			//desc
			oFollowComments.sort(function (x, y) {
				var a = new Date(x["updateTime"]);
				var b = new Date(y["updateTime"]);
				return a == b ? 0 : (a > b ? -1 : 1);
			});

			//ok
			callback(oResult);
		};

		this.unsubscribeComments = function (sArticleLink, callback) {
			delete this.m_oMapFollows[sArticleLink];
			this._saveFollows();
			callback(null);
		};

		this.followComments = function (oEntity, callback) {
			//
			var sArticleLink = oEntity["articleLink"];

			//
			if (String2.isEmpty(sArticleLink)) {
				callback(false);
				return;
			}

			//
			var oFollowInfo = this.m_oMapFollows[sArticleLink];
			if (oFollowInfo == null) {
				//new
				oFollowInfo = new Object();
				oFollowInfo["articleLink"] = sArticleLink;
				oFollowInfo["articleTitle"] = oEntity["articleTitle"];
				oFollowInfo["feedTitle"] = oEntity["feedTitle"];
				oFollowInfo["feedLink"] = oEntity["feedLink"];
				oFollowInfo["formId"] = oEntity["formId"];
				oFollowInfo["createTime"] = new Date();
				oFollowInfo["updateTime"] = new Date();

				this.m_oMapFollows[sArticleLink] = oFollowInfo;

				//save
				this._saveFollows();

				//add to the header of array
				this.m_oArrayChecking.unshift(sArticleLink);
				this._checkOne();
			}
			else {
				//only update createTime
				oFollowInfo["createTime"] = new Date();
				//save
				this._saveFollows();
			}

			callback(true);
		};

		this._loadFollows = function () {
			this.m_oMapFollows = cbase.getoption("follows", null);
			if (this.m_oMapFollows == null) {
				this.m_oMapFollows = new Object();
			}
		};

		this._saveFollows = function () {
			//
			cbase.setoption("follows", this.m_oMapFollows);

			//
			this._checkNotify();
		};

		this._countTotalComments = function () {
			var nCount = 0;
			for (var sArticleLink in this.m_oMapFollows) {
				var oFollowInfo = this.m_oMapFollows[sArticleLink];
				nCount += this._countComments(oFollowInfo);
			}
			return nCount;
		};
		this._countComments=function(oFollowInfo){
			return CEntityset.getDataLength(oFollowInfo["data"]);
		};
		this._checkNotify = function () {
			cbase.notifyFollowCommentsChanged(this._countTotalComments());
		};

		this._getOption_CheckInterval = function () {
			var oOptions = this.m_oMain._getDataOptions();
			return oOptions["follow_checkinterval"];
		};
		this._getOption_CheckEnabled = function () {
			var oOptions = this.m_oMain._getDataOptions();
			return oOptions["follow_checkenabled"];
		};

		this._startCheckNow = function () {
			//clear array
			this.m_oArrayChecking = new Array();

			//prepare array
			for (var sArticleLink in this.m_oMapFollows) {
				this.m_oArrayChecking.push(sArticleLink);
			}

			//check one
			this._checkOne();
		};

		this._startCheck = function () {
			var oThis = this;

			//force clear timeout
			if (this.m_nTimeoutId != 0) {
				window.clearTimeout(this.m_nTimeoutId);
				this.m_nTimeoutId = 0;
			}

			//force check
			if (!this._getOption_CheckEnabled())
				return;

			//
			this.m_nTimeoutId = window.setTimeout(function () {
				oThis.m_nTimeoutId = 0;
				oThis._startCheckNow();
			}, this._getOption_CheckInterval() * 60 * 1000);
		};

		this._checkOneGet = function () {
			while (true) {
				var sArticleLink = this.m_oArrayChecking.pop();
				if (String2.isEmpty(sArticleLink))
					break;

				//may be deleted
				var oFollowInfo = this.m_oMapFollows[sArticleLink];
				if (oFollowInfo != null)
					return oFollowInfo;

				//loop
			}

			return null;
		};

		this._checkOne = function () {
			var oThis = this;

			//check if parsing
			if (!String2.isEmpty(this.m_sArticleLinkParsing))
				return;

			//popone
			var oFollowInfo = this._checkOneGet();
			if (oFollowInfo == null) {
				//complete all check, start check again
				this._startCheck();
			}
			else {
				this.m_sArticleLinkParsing = oFollowInfo["articleLink"];
				this._checkOne2(oFollowInfo, function () {
					oThis.m_sArticleLinkParsing = "";
					oThis._checkOne();
				});
			}
		};

		this._checkOne2 = function (oFollowInfo, callback) {
			var oThis = this;

			//
			var sArticleLink = oFollowInfo["articleLink"];

			//prepare old commentids
			var oMapCommentId = new Object();
			var oArrayCommentId = oFollowInfo["commentIds"];
			if (oArrayCommentId != null) {
				for (var i = 0; i < oArrayCommentId.length; i++) {
					oMapCommentId[oArrayCommentId[i]] = true;
				}
			}

			//temp entityset
			var oEntitysetComments = new CEntityset();

			//parse page
			oThis._checkOne2_parsepage(1, oEntitysetComments, oMapCommentId, oFollowInfo, function (oResult) {
				if (oResult) {
					//传入sArticleLink便于重新判断followinfo是否存在
					oThis._checkOne2_resultsave(oEntitysetComments, sArticleLink);
				}

				//weather oResult=true/false always remove articlecomments
				oThis.m_oContentManager.clearArticleComments(sArticleLink, function () { });

				//ok
				callback(null);
			});

		};

		this._checkOne2_resultsave = function (oEntitysetComments, sArticleLink, callback) {
			//为了确保数据一致及最新，不能在外层创建，因为在执行检测过程中，有可能用户已经清除了旧数据
			//	因此也需要重新判断followinfo是否存在
			var oFollowInfo = this.m_oMapFollows[sArticleLink];
			if (oFollowInfo == null)
				return;

			//
			var oMapCommentId = new Object();
			var oArrayCommentId = oFollowInfo["commentIds"];
			if (oArrayCommentId != null) {
				for (var i = 0; i < oArrayCommentId.length; i++) {
					oMapCommentId[oArrayCommentId[i]] = true;
				}
			}

			var bFirstCheck = oArrayCommentId == null;
			if (oArrayCommentId == null)
				oArrayCommentId = new Array();

			//prepare old comments
			var oEntitysetNew = new CEntityset();
			oEntitysetNew.setData(oFollowInfo["data"]);

			//append
			oEntitysetNew.moveLast();
			oEntitysetComments.moveLast();
			while (!oEntitysetComments.isBegin()) {
				//id
				var sId = oEntitysetComments.getAttribute("id", "");
				//check if exists
				if (oMapCommentId[sId] !== true) {
					if (!bFirstCheck) {
						oEntitysetNew.addNew();
						oEntitysetComments.copyTo(oEntitysetNew);
					}

					oArrayCommentId.push(sId);
					oMapCommentId[sId] = true;
				}

				//next
				oEntitysetComments.movePrevious();
			}

			//save
			oFollowInfo["data"] = oEntitysetNew.getData();
			oFollowInfo["commentIds"] = oArrayCommentId;
			oFollowInfo["updateTime"] = new Date();
			this._saveFollows();
		};

		this._checkOne2_parsepage = function (nPageIndex, oEntitysetComments, oMapCommentId, oFollowInfo, callback) {
			var oThis = this;

			var oParams = new Object();
			oParams["pageIndex"] = nPageIndex;
			oParams["showOrder"] = "desc";
			oParams["articleLink"] = oFollowInfo["articleLink"];
			oParams["articleTitle"] = oFollowInfo["articleTitle"];
			oParams["formId"] = oFollowInfo["formId"];
			//	link as articleIndex
			oParams["articleIndex"] = oFollowInfo["articleLink"];
			oParams["returnRaw"] = true;
			oParams["autoCache"] = false;

			this.m_oContentManager.showPageOuter(oParams, function (oResult) {
				if (oResult == null) {
					callback(false);
				}
				else if (oResult["status"] != "succeeded") {
					callback(false);
				}
				else {
					var nTotalCount = oResult["totalcount"];
					var nPageCount = oResult["pagecount"];
					var nPageSize = oResult["pagesize"];

					//
					var oThisEntityset = oResult["content"];

					//
					var bContinue = oThis._appendComments(oFollowInfo, oThisEntityset, oMapCommentId, oEntitysetComments, nPageIndex, nPageCount);

					//need more page
					if (bContinue) {
						//not greater then pageCount
						if (nPageIndex >= nPageCount)
							bContinue = false;
					}

					//
					if (bContinue) {
						//next page
						oThis._checkOne2_parsepage(nPageIndex + 1, oEntitysetComments, oMapCommentId, oFollowInfo, function (oResult) {
							callback(oResult);
						});
					}
					else {
						callback(true);
					}
				}
			});
		};

		this._appendComments = function (oFollowInfo, oThisEntityset, oMapCommentId, oEntitysetComments, nPageIndex, nPageCount) {
			//2009.10.16 如果是最后一页，即使comment已存在，也要继续监测是否有新的。从而支持对回复的抓取
			//				（因为是倒序，所以是第一页）
			var bIsLastPage = (nPageIndex <= 1);
			var bHasParsedTotal = false;

			//loop
			oThisEntityset.moveLast();
			while (!oThisEntityset.isBegin()) {
				//id must exists
				var sId = oThisEntityset.getAttribute("id", "");

				//必须先判断Id是否已存在
				//2009.10.16 支持最后一页（因为是倒序，所以是第一页）对回复的处理
				var bHasParsed = oMapCommentId[sId] != null;
				if (bHasParsed)
					bHasParsedTotal = true;

				if (!bIsLastPage && bHasParsed)
					return false;

				//copy
				if (!bHasParsed) {
					oEntitysetComments.addNew();
					oThisEntityset.copyTo(oEntitysetComments);
				}

				//必须是添加了一条然后再判断是否超过了条目数
				//2009.10.16 支持最后一页（因为是倒序，所以是第一页）对回复的处理
				if (!bIsLastPage && oEntitysetComments.getCount() > 1000)
					return false;

				//move previous
				oThisEntityset.movePrevious();
			}

			//如果是第一次获取，只取第一页
			if (oFollowInfo["commentIds"] == null)
				return false;

			//可能继续获取
			return !bHasParsedTotal;
		};

	}

	/////////////////////////////
	function CFeedLinkFormManager(oMain) {
		//properties
		this.m_oMain = oMain;
		this.m_oMapForFeeds = new Object();
		this.m_oMapForFeedsChecking = new Object();

		//method
		this._removeAllEmptyRecords = function () {
			for (var sFeedLink in this.m_oMapForFeeds) {
				var oFeed = this.m_oMapForFeeds[sFeedLink];
				if (oFeed != null && String2.isEmpty(oFeed["formId"])) {
					delete this.m_oMapForFeeds[sFeedLink];
				}
			}
		};

		this._commentsCheck = function (params, onresponse) {
			var oThis = this;

			var oEntity = params;
			var sFeedLink = oEntity["feedLink"];
			if (sFeedLink != "") {
				var oFeed = oThis.m_oMapForFeeds[sFeedLink];
				if (oFeed != null) {
					var nFormMode = oFeed["formMode"];
					var sFormId = oFeed["formId"];

					//
					if (nFormMode == 1) {
						//start as article
						oThis._commentsCheckFormId(oEntity["articleLink"], oEntity["articleTitle"], 'article', function (bSucceeded, sFormId) {
							oEntity["succeeded"] = bSucceeded;
							oEntity["formId"] = sFormId;
							oEntity["formStep"] = "article";
							onresponse(oEntity);
						});
					}
					else {
						//ok
						oEntity["succeeded"] = true;
						oEntity["formId"] = sFormId;
						oEntity["formStep"] = "feed";
						onresponse(oEntity);
					}
				}
				else {
					//start as feed
					oThis._commentsCheckFormId(oEntity["feedLink"], oEntity["feedTitle"], 'feed', function (bSucceeded, sFormId, nFormMode) {
						if (!bSucceeded) {
							oEntity["succeeded"] = bSucceeded;
							onresponse(oEntity);
						}
						else {
							//feed info force check
							var oFeed = oThis.m_oMapForFeeds[sFeedLink];
							if (oFeed == null) {
								oFeed = new Object();
								oThis.m_oMapForFeeds[sFeedLink] = oFeed;
							}
							oFeed["feedLink"] = sFeedLink;
							oFeed["feedTitle"] = oEntity["feedTitle"];
							oFeed["formId"] = sFormId;
							oFeed["formMode"] = nFormMode;

							//check article again
							oThis._commentsCheck(oEntity, function (oParams) {
								//oParams is oEntity
								onresponse(oParams);
							});
						}
					});
				}
			}
			else {
				//start as article
				oThis._commentsCheckFormId(oEntity["articleLink"], oEntity["articleTitle"], 'article', function (bSucceeded, sFormId) {
					oEntity["succeeded"] = bSucceeded;
					oEntity["formId"] = sFormId;
					oEntity["formStep"] = "article";
					onresponse(oEntity);
				});
			}
		};

		this._commentsCheckFormId= function (sLink, sTitle, sStep, callback) {
			var oThis = this;

			//加入一个队列，避免重复检测feed
			var oChecking = oThis.m_oMapForFeedsChecking[sLink];
			if (oChecking != null) {
				oChecking.push(callback);
			}
			else {
				oChecking = new Array();
				oThis.m_oMapForFeedsChecking[sLink] = oChecking;

				oChecking.push(callback);

				oThis._commentsCheckFormId2(sLink, sTitle, sStep, "", function (bSucceeded, sFormId, nFormMode) {
					for (var i = 0; i < oChecking.length; i++) {
						oChecking[i](bSucceeded, sFormId, nFormMode);
					}

					delete oThis.m_oMapForFeedsChecking[sLink];
				});
			}
		};

		this._commentsCheckFormId2 = function (sLink, sTitle, sStep,sFormIdWant, callback) {
			var oThis = this;

			//
			var sURL = ctools.appendQueryStringValue(URL_Feed_FormMatch, 'ItemLink', sLink);
			sURL = ctools.appendQueryStringValue(sURL, 'ItemTitle', sTitle);
			sURL = ctools.appendQueryStringValue(sURL, 'one', 'on');
			sURL = ctools.appendQueryStringValue(sURL, 'reason', 'reader');
			sURL = ctools.appendQueryStringValue(sURL, 'step', sStep);
			sURL = ctools.appendQueryStringValue(sURL, 'FormId', sFormIdWant);

			XMLHttpManager.openRequest2(sURL, null, function (oRequest) {
				if (oRequest.status != 200) {
					callback(false, "", 0);
				}
				else {
					var oArrayInfo = oThis._parseInfoOfFormMatch(oRequest);
					if (oArrayInfo == null) {
						callback(true, "", 0);
					}
					else {
						var sFormId = oArrayInfo[0];
						var sVersion = oArrayInfo[1];
						var nFormMode = oArrayInfo[2];
						var sSystemFormId = oArrayInfo[3];
						var sSystemFormVersion = oArrayInfo[4];

						//1. check system form first
						oThis.m_oMain.m_oFormManager.formExistsAndValid(sSystemFormId, sSystemFormVersion, function (bSucceeded) {
							if (!bSucceeded) {
								callback(false, sFormId, nFormMode);
							}
							else {
								//2. then check form
								oThis.m_oMain.m_oFormManager.formExistsAndValid(sFormId, sVersion, function (bSucceeded) {
									//	record system form info
									if (bSucceeded) {
										var oFormInfo = oThis.m_oMain.m_oFormManager.getFormInfo(sFormId);
										if (oFormInfo != null) {
											oFormInfo["systemFormId"] = sSystemFormId;
											oFormInfo["systemFormVersion"] = sSystemFormVersion;
										} 
									}

									callback(bSucceeded, sFormId, nFormMode);
								});
							}
						});
					}
				}
			});
		};

		this._parseInfoOfFormMatch = function (oRequest) {
			var oRoot = ctools.nodeFromXML(oRequest.responseText);
			if (oRoot != null && String2.compareNoCase(oRoot.nodeName, 'NewDataSet') == 0) {
				var oNodeFormId = ctools.selectSingleNode(oRoot, 'Table/FormId');
				if (oNodeFormId != null) {
					var oNodeVersion = ctools.selectSingleNode(oRoot, 'Table/Version');
					var oNodeFormParam2 = ctools.selectSingleNode(oRoot, 'Table/FormParam2');
					var oNodeSystemFormId = ctools.selectSingleNode(oRoot, 'Table/SystemFormId');
					var oNodeSystemFormVersion = ctools.selectSingleNode(oRoot, 'Table/SystemFormVersion');
					if (oNodeFormId != null && oNodeVersion != null && oNodeFormParam2 != null
						&& oNodeSystemFormId != null && oNodeSystemFormVersion != null) {
						var oArrayInfo = new Array();
						oArrayInfo[0] = ctools.adjustGuid(ctools.getNodeText(oNodeFormId));
						oArrayInfo[1] = ctools.getNodeText(oNodeVersion);
						oArrayInfo[2] = ctools.getNodeText(oNodeFormParam2).indexOf('mixed') > -1 ? 1 : 0;
						oArrayInfo[3] = ctools.adjustGuid(ctools.getNodeText(oNodeSystemFormId));
						oArrayInfo[4] = ctools.getNodeText(oNodeSystemFormVersion);

						//ok
						return oArrayInfo;
					} 
				}
			}

			//nothing
			return null;
		};

	}

	/////////////////////////////
	function CFormManager(oMain){
		//properties
		this.m_oMain=oMain;
		this.m_oMapForms = new Object();
		this.m_oMapFormsChecking = new Object();

		//method
		this.getFormInfo = function (sFormId) {
			return this.m_oMapForms[sFormId];
		};

		this.formExistsAndValid = function (sFormId, sVersion, callback) {
			var oThis = this;

			// check if exists
			var oFormInfo = oThis.m_oMapForms[sFormId];
			if (oFormInfo != null) {
				callback(true);
				return;
			}

			//加入一个队列，避免重复检测form
			var oChecking = oThis.m_oMapFormsChecking[sFormId];
			if (oChecking != null) {
				oChecking.push(callback);
			}
			else {
				oChecking = new Array();
				oThis.m_oMapFormsChecking[sFormId] = oChecking;

				oChecking.push(callback);

				oThis._formExistsAndValid2(sFormId, sVersion,false, function (bSucceeded) {
					for (var i = 0; i < oChecking.length; i++) {
						oChecking[i](bSucceeded);
					}

					delete oThis.m_oMapFormsChecking[sFormId];
				});
			}
		};

		this._formExistsAndValid2 = function (sFormId, sVersion, bNoCache, callback) {
			var oThis = this;

			// try get form
			var sURL = String2.format("{0}?FormId={1}", URL_Feed_FormDownload, sFormId);
			var oParams = new Object();
			oParams["noCache"] = bNoCache;

			XMLHttpManager.openRequest2(sURL, oParams, function (oRequest) {
				//
				if (oRequest.status != 200) {
					callback(false);
					return;
				}

				//extract
				var oFormInfo = oThis._extractFormInfo(oRequest.responseText);
				if (oFormInfo == null) {
					callback(false);
					return;
				}

				//check verison
				if (sVersion <= oFormInfo["formVersion"].toString()) {
					//save form info
					oThis.m_oMapForms[sFormId] = oFormInfo;

					//ok
					callback(true);
					return;
				}

				//force download
				oThis._formExistsAndValid2(sFormId, sVersion, true, function (bSucceeded) {
					callback(bSucceeded);
					return;
				});
			});
		};

		this.debug_setform = function (oFormInfoDebug, callback) {
			var oThis = this;

			var sFormId = oFormInfoDebug["formId"];
			if (sFormId == "{B1C8E6FB-C609-49BA-94E5-22F6B84CF93A}") {
				var oFormInfo = new Object();

				oFormInfo["formId"] = sFormId;
				oFormInfo["formTitle"] = oFormInfoDebug["ItemTitle"];
				oFormInfo["formVersion"] = oFormInfoDebug["Version"];
				oFormInfo["formParam2"] = oFormInfoDebug["FormParam2"];
				oFormInfo["formHTM"] = oFormInfoDebug["FormHTM"];
				oFormInfo["formXML"] = oFormInfoDebug["FormXML"];
				oFormInfo["formJS"] = oFormInfoDebug["FormJS"];

				oThis.m_oMapForms[sFormId] = oFormInfo;

				//ok
				callback(true);
			}
			else {
				var sSystemFormId = oFormInfoDebug["systemFormId"];
				var sSystemFormVersion = oFormInfoDebug["systemFormVersion"];

				//1. check system form first
				oThis.formExistsAndValid(sSystemFormId, sSystemFormVersion, function (bSucceeded) {
					if (!bSucceeded) {
						callback(false);
					}
					else {
						var oFormInfo = new Object();

						oFormInfo["formId"] = sFormId;
						oFormInfo["formTitle"] = oFormInfoDebug["ItemTitle"];
						oFormInfo["formVersion"] = oFormInfoDebug["Version"];
						oFormInfo["formParam2"] = oFormInfoDebug["FormParam2"];
						oFormInfo["formHTM"] = oFormInfoDebug["FormHTM"];
						oFormInfo["formXML"] = oFormInfoDebug["FormXML"];
						oFormInfo["formJS"] = oFormInfoDebug["FormJS"];

						oFormInfo["systemFormId"] = oFormInfoDebug["systemFormId"];
						oFormInfo["systemFormVersion"] = oFormInfoDebug["systemFormVersion"];

						oThis.m_oMapForms[sFormId] = oFormInfo;

						//ok
						callback(true);
					}
				});
			}
		};

		this._extractFormInfo = function (sResponseText) {
			var oRoot = ctools.nodeFromXML(sResponseText);
			if(oRoot!=null){
				var oNodeItem=ctools.selectSingleNode(oRoot,"plugins/plugin[@guid=\"{00000000-0000-0000-0002-000000000008}\"]/entities/entity[@index=\"0\"]/items/item");	
				if(oNodeItem!=null){
					var oNodeFields=ctools.selectSingleNode(oNodeItem,"fields");
					if(oNodeFields!=null){
						var oFormInfo=new Object();

						oFormInfo["formId"] = oNodeItem.getAttribute("itemId");
						oFormInfo["formTitle"] = this._getFieldValueForForm(oNodeFields, "ItemTitle");
						oFormInfo["formVersion"] = this._getFieldValueForForm(oNodeFields, "Version");
						oFormInfo["formParam2"] = this._getFieldValueForForm(oNodeFields, "FormParam2");
						oFormInfo["formHTM"] = this._getFieldValueForForm(oNodeFields, "FormHTM");
						oFormInfo["formXML"] = this._getFieldValueForForm(oNodeFields, "FormXML");
						oFormInfo["formJS"] = this._getFieldValueForForm(oNodeFields, "FormJS");

						//ok
						return oFormInfo;
					}
				}
			}

			//
			return null;
		};

		this._getFieldValueForForm = function (oNodeFields, sFieldName) {
			var s= String2.format("field[@name=\"{0}\"]", sFieldName);
			return ctools.getNodeText(ctools.selectSingleNode(oNodeFields, s));
		};

		this.getRuntimeFormInfo = function (sFormId) {
			var oFormInfo = this.m_oMapForms[sFormId];
			if (oFormInfo == null)
				return null;

			var oRuntimeInfo = oFormInfo["runtime"];
			if (oRuntimeInfo == null) {
				//new
				oRuntimeInfo = new Object();
				//parse

				//1. form xml
				var oNodeRoot = ctools.nodeFromXML(oFormInfo["formXML"]);
				oRuntimeInfo["node_formForComments"] = ctools.selectSingleNode(oNodeRoot, "formForComments");
				oRuntimeInfo["node_trackComments"] = ctools.selectSingleNode(oRuntimeInfo["node_formForComments"], "trackComments");
				oRuntimeInfo["pageOrderDirection"] = ctools.getAttribute(oRuntimeInfo["node_trackComments"], "pageOrderDirection", "");
				oRuntimeInfo["cacheMode"] = ctools.getAttribute(oRuntimeInfo["node_trackComments"], "cacheMode", "");
				//2. form js, must cache the class objcet immediately, void conflict.
				window.eval(oFormInfo["formJS"]);
				oRuntimeInfo["trackcomments_className"] = ctools.getAttribute(oRuntimeInfo["node_trackComments"], "className", "");
				if (oRuntimeInfo["trackcomments_className"] != "") {
					oRuntimeInfo["trackcomments_class"] = window[oRuntimeInfo["trackcomments_className"]];
				}

				//record
				oFormInfo["runtime"] = oRuntimeInfo;
			}

			return oRuntimeInfo;
		}
	}

	//////////////////////////////
	function CArticleCommentsTools(oMain){
		//properties
		this.m_oMain=oMain;
		this.m_sArticleTitle='';
		this.m_sArticleLink='';
		this.m_sFormId='';
		this.m_sPageOrderDirection='';
		this.m_sCacheMode = '';
		this.m_bDebug_Enabled = false;


		this.m_oValues=new Object();
		this.m_oMapEntitysetComments=new Object();

		this.m_nInfo_TotalCount=-1;
		this.m_nInfo_PageCount=-1;
		this.m_nInfo_PageSize=-1;

		this.m_nInfo_CurrentShow_PageIndex=0;
		this.m_nInfo_CurrentShow_Params=null;
		this.m_nInfo_CurrentShow_Callback=null;

		this.m_nInfo_CurrentParse_Object=null;

		this.m_nInfo_Waiting_PageIndexArray=new Array();

		this.m_nForward_tmp_totalcount=-1;
		this.m_nForward_tmp_firstpagesize=-1;

		this.m_bSendFormCheckOnce = false;	//check if form has error 

		//method
		this.init=function(oParams){
			this.m_sArticleTitle=oParams["articleTitle"];
			this.m_sArticleLink=oParams["articleLink"];
			this.m_sFormId = oParams["formId"];
			this.m_bDebug_Enabled = oParams["debug_enabled"];

			var oRuntimeInfo = this.m_oMain.m_oFormManager.getRuntimeFormInfo(this.m_sFormId);
			if(oRuntimeInfo!=null){
				this.m_sPageOrderDirection=oRuntimeInfo["pageOrderDirection"];
				this.m_sCacheMode=oRuntimeInfo["cacheMode"];
			}

			//always parse page 1
			this._parseComments(1);
		};

		this.showPageOuter=function(oParams,callback){
			
			//pageindex in
			var nPageIndex_in = this._adjustpageindex(oParams["pageIndex"], true, oParams["showOrder"]);

			this._showPageInner(nPageIndex_in,oParams,callback);
		};

		this._showPageInner = function (nPageIndex_in, oParams, callback) {
			//provider a array, only start one each time.
			//
			var nPageCount = this.m_nInfo_PageCount;

			//adjust pageindex
			var nPageIndex = nPageIndex_in;
			if (nPageIndex_in == -1 && nPageCount != -1) {
				nPageIndex = nPageCount;
			}

			//check if exists
			var oEntitysetComments = this._getEntitysetCommentsByPageIndex(nPageIndex);
			if (oEntitysetComments != null) {
				//reset
				if (this.m_nInfo_CurrentShow_Callback != null && this.m_nInfo_CurrentShow_Callback != callback) {
					this.m_nInfo_CurrentShow_Callback(null);
				}
				this.m_nInfo_CurrentShow_PageIndex = 0;
				this.m_nInfo_CurrentShow_Params = null;
				this.m_nInfo_CurrentShow_Callback = null;

				//show
				this._callback_show(nPageIndex, oEntitysetComments, oParams, callback);

				//
				if (oParams["autoCache"] !== false) {
					this._task_addcache_auto(nPageIndex);
				}
			}
			else {
				//only one parse each time
				if (this.m_nInfo_CurrentShow_Callback != null && this.m_nInfo_CurrentShow_Callback != callback) {
					//nothing to clear old parse
					this.m_nInfo_CurrentShow_Callback(null);
				}

				//current
				this.m_nInfo_CurrentShow_Callback = callback;
				this.m_nInfo_CurrentShow_PageIndex = nPageIndex;
				this.m_nInfo_CurrentShow_Params = oParams;

				//
				if (this.m_nInfo_CurrentParse_Object == null) {
					//immediately parse
					this._parseComments(this.m_nInfo_CurrentShow_PageIndex);
				}
				else {
					//do nothing
				}
			}
		};

		this._task_addcache_auto=function(nPageIndex){
			//仅适用于auto
			if(!String2.isEmpty(this.m_sCacheMode) && this.m_sCacheMode!="auto")
				return;

			//info不完全
			if(this.m_nInfo_PageCount==-1)
				return;

			//
			var nPageIndex1=-1;
			var nPageIndex2=-1;

			//next
			nPageIndex1=this._task_getcacheindex(nPageIndex,true);
			if(nPageIndex1==-1)
			{
				//向previous连取两页
				nPageIndex1=this._task_getcacheindex(nPageIndex,false);
				if(nPageIndex1!=-1)
					nPageIndex2=this._task_getcacheindex(nPageIndex1,false);
			}
			else
			{
				//previous
				nPageIndex2=this._task_getcacheindex(nPageIndex,false);
				if(nPageIndex2==-1)
				{
					//向next再取一页
					nPageIndex2=this._task_getcacheindex(nPageIndex1,true);
				}
			}

			//parse 1
			if(nPageIndex1!=-1)
			{
				//parse
				this._addWaitingTask(nPageIndex1);
			}

			//parse 2
			if(nPageIndex2!=-1)
			{
				//parse
				this._addWaitingTask(nPageIndex2);
			}
		};

		this._task_getcacheindex=function(nPageIndex,bNext){
			//在这里pagecount已经确定了

			//
			var nIndex=nPageIndex;
			while(true)
			{
				//step
				nIndex=bNext ? ++nIndex : --nIndex;

				//check
				if(nIndex<1 || nIndex>this.m_nInfo_PageCount)
					break;

				//
				if(this._cancreatetask(nIndex))
				{
					//ok
					return nIndex;
				}
	
				//next
			}

			//没有合适的
			return -1;
		};

		this._parseComments = function (nPageIndex_in) {
			var oThis = this;

			//pageindex
			var nPageIndex;
			if (nPageIndex_in != -1) {
				nPageIndex = nPageIndex_in;
			}
			else {
				//-1
				if (this.m_nInfo_PageCount == -1)
					nPageIndex = nPageIndex_in;
				else
					nPageIndex = this.m_nInfo_PageCount;
			}

			//check 1
			if (this.m_nInfo_CurrentParse_Object != null)
				return false;

			//check 2
			if (!this._cancreatetask(nPageIndex))
				return false;

			//create task
			//prepare properties
			var oProperties = new Object();

			//form
			oProperties["pageIndex"] = nPageIndex;
			oProperties["itemTitle"] = this.m_sArticleTitle;
			oProperties["itemLink"] = this.m_sArticleLink;
			oProperties["formId"] = this.m_sFormId;
			oProperties["_debug_enabled"] = this.m_bDebug_Enabled;

			var oRuntimeInfo = this.m_oMain.m_oFormManager.getRuntimeFormInfo(this.m_sFormId);

			oProperties["formForComments"] = oRuntimeInfo["node_formForComments"];
			oProperties["trackComments"] = oRuntimeInfo["node_trackComments"];

			//system info
			var oFormInfo = this.m_oMain.m_oFormManager.getFormInfo(this.m_sFormId);
			oProperties["formId_system"] = oFormInfo["systemFormId"];

			var oRuntimeInfoSystem = this.m_oMain.m_oFormManager.getRuntimeFormInfo(oProperties["formId_system"]);
			oProperties["formForComments_system"] = oRuntimeInfoSystem["node_formForComments"];
			oProperties["trackComments_system"] = oRuntimeInfoSystem["node_trackComments"];

			//use the same values
			oProperties["_values"] = this.m_oValues;

			//
			oProperties["_window"] = window;
			oProperties["_document"] = document;

			//object
			if (oRuntimeInfo["trackcomments_class"] != null)
				this.m_nInfo_CurrentParse_Object = new oRuntimeInfo["trackcomments_class"]();
			else
				this.m_nInfo_CurrentParse_Object = new oRuntimeInfoSystem["trackcomments_class"]();

			//may throw exception
			try {
				this.m_nInfo_CurrentParse_Object.parse(oProperties, function (oResult) {
					oThis._parseComments_checkResult(nPageIndex, oResult);
				});
			} catch (e) {
				oThis._parseComments_checkResult(nPageIndex, null);
			}

			return true;
		};

		this._parseComments_checkResult = function (nPageIndex, oResult) {
			var oThis = this;

			//
			oThis._task_callback(nPageIndex, oResult);

			//clear current parse
			if (oThis.m_nInfo_CurrentParse_Object != null) {
				try {
					oThis.m_nInfo_CurrentParse_Object.dispose();
				}
				catch (e) { }
				oThis.m_nInfo_CurrentParse_Object = null;
			}

			//next parse
			oThis._parseNext();
		};

		this._addWaitingTask=function(nPageIndex){
			this.m_nInfo_Waiting_PageIndexArray.push(nPageIndex);
			this._parseNext();
		};

		this._parseNext=function(){
			if(this.m_nInfo_CurrentParse_Object!=null)
				return false;

			//1. 
			if(this.m_nInfo_CurrentShow_PageIndex!=0){
				var bResult=this._parseComments(this.m_nInfo_CurrentShow_PageIndex);
				if(bResult)
					return true;
			}

			//2.
			var nPageIndexWaiting=this.m_nInfo_Waiting_PageIndexArray.pop();
			while(nPageIndexWaiting!=null){
				var bResult=this._parseComments(nPageIndexWaiting);
				if(bResult)
					return true;
				else 
					nPageIndexWaiting=this.m_nInfo_Waiting_PageIndexArray.pop();
			}

			return false;
		};

		this._getRealPageIndexCurrent = function () {
			if (this.m_nInfo_CurrentShow_PageIndex == -1 && this.m_nInfo_PageCount != -1)
				return this.m_nInfo_PageCount;
			else
				return this.m_nInfo_CurrentShow_PageIndex;
		};

		this._task_callback = function (nPageIndex, oResult) {
			//check
			if (oResult == null) {
				//failed
				this._task_callback_raisefailed();
			}
			else {
				//comments
				var oEntitysetComments = oResult["comments"];

				//save
				this.m_oMapEntitysetComments[nPageIndex] = oEntitysetComments;

				//check info
				var bEnd = this._task_callback_checkInfo(nPageIndex, oResult, oEntitysetComments);

				//2009.05.05 当cachemode="forward"时，就需要接着向后cache。
				//	放到check info后面是为了尽量提前知道pagecount
				//仅适用于forward
				if (this.m_sCacheMode == "forward") {
					bEnd = this._task_addcache_forward(nPageIndex);
				}

				//check show
				//2010.05.17 如果还没有确认info，就暂时不显示。否则，有些倒叙显示的comments，当pagecount==-1时，第一页的序号不正确
				if (!this._shouldCheckInfo()) {
					//ready
					this._task_callback_checkShow();
				}
				else if(bEnd){
					//failed
					this._task_callback_raisefailed();
				}
			}
		};

		this._task_callback_raisefailed = function () {
			
			var nPageIndex=this.m_nInfo_CurrentShow_PageIndex;
			var oParams=this.m_nInfo_CurrentShow_Params;
			var oCallback = this.m_nInfo_CurrentShow_Callback;

			this.m_nInfo_CurrentShow_PageIndex = 0;
			this.m_nInfo_CurrentShow_Params = null;
			this.m_nInfo_CurrentShow_Callback = null;

			this._task_callback_raisefailed2(oCallback);
		};
		this._task_callback_raisefailed2 = function (oCallback) {
			//formcheck
			this._sendFormCheck(true);

			//error
			this._setDefaultPageInfo();

			//
			if (oCallback != null) {
				//callback
				var oResult = new Object();
				//status
				oResult["status"] = "failed";
				oCallback(oResult);
			}
		};

		this._task_callback_checkShow = function () {
			//formcheck
			this._sendFormCheck(false);

			//check
			if(this.m_nInfo_CurrentShow_PageIndex!=0){
			var nPageIndexCurrent = this._getRealPageIndexCurrent();
			if (nPageIndexCurrent != -1) {
				//强制检测登记的页是否可以显示了
				var oEntitysetComments = this._getEntitysetCommentsByPageIndex(nPageIndexCurrent);
				if (oEntitysetComments != null) {
					this._showPageInner(nPageIndexCurrent,
									this.m_nInfo_CurrentShow_Params,
									this.m_nInfo_CurrentShow_Callback);
				}
			}
			}
		};

		this._task_addcache_forward = function (nPageIndex) {
			//
			var sNextPageLink = this._get_nextpagelink_forward(nPageIndex);
			if (String2.isEmpty(sNextPageLink))
				return true;

			//forward parse
			this._addWaitingTask(nPageIndex + 1);
			return false;
		};

		this._get_nextpagelink_forward=function(nPageIndex){
			//仅适用于forward
			if(this.m_sCacheMode=="forward")
			{
				if(this.m_oValues!=null)
				{
					var oEntityCacheNext=this.m_oValues["__entityCacheNext"];
					if(oEntityCacheNext!=null)
					{
						return oEntityCacheNext[nPageIndex];
					}
				}
			}

			//
			return "";
		};

		//for only parse pageinfo once
		this._setDefaultPageInfo = function () {
			if (this.m_nInfo_TotalCount == -1)
				this.m_nInfo_TotalCount = 0;

			if (this.m_nInfo_PageCount == -1)
				this.m_nInfo_PageCount = 1;

			if (this.m_nInfo_PageSize == -1)
				this.m_nInfo_PageSize = 0;
		};

		//check if form has error
		this._sendFormCheck = function (bFailed) {
			//
			if (this.m_bSendFormCheckOnce)
				return;

			//
			var sMessage = "";
			if (bFailed) {
				sMessage = "failed:";
			} else {
				//may be wrong
				if (this.m_nInfo_TotalCount <= 0 && this.m_nInfo_PageCount <= 1) {
					sMessage = String2.format("succeeded:{0},{1}", this.m_nInfo_TotalCount, this.m_nInfo_PageCount);
				}
			}

			//
			if (sMessage != "") {
				this.m_bSendFormCheckOnce = true;

				//send
				var sURL = ctools.appendQueryStringValue(URL_Feed_FormCheck, 'ItemLink', this.m_sArticleLink);
				sURL = ctools.appendQueryStringValue(sURL, 'ItemTitle', this.m_sArticleTitle);
				sURL = ctools.appendQueryStringValue(sURL, 'FormId', this.m_sFormId);
				sURL = ctools.appendQueryStringValue(sURL, 'Desp', sMessage);

				XMLHttpManager.openRequest2(sURL,null,null);
			}
		};

		this._task_callback_checkInfo = function (nPageIndex, oResult, oEntitysetComments) {
			//已经确定
			if (!this._shouldCheckInfo())
				return true;

			//default
			var bEnd = true;

			//comments totalcount pagecount
			var nTotalCount = ctools.getAttribute(oResult, "totalcount", -1);
			var nPageCount = ctools.getAttribute(oResult, "pagecount", -1);

			var nPageSize = oEntitysetComments.getCount();


			//2009.12.29 如果是forward,那么,pagecount有可能到最后才能确定.
			//				除非，在form中自行计算。在这里是不用计算的
			if (this.m_sCacheMode == "forward") {
				//2009.12.29 不等于－１就按正常的模式
				if (nPageCount == -1) {
					//累计作为totalcount
					if (nPageIndex == 1) {
						this.m_nForward_tmp_totalcount = 0;
						this.m_nForward_tmp_firstpagesize = nPageSize;
					}

					this.m_nForward_tmp_totalcount += nPageSize;

					//
					var sNextPageLink = this._get_nextpagelink_forward(nPageIndex);
					if (!String2.isEmpty(sNextPageLink)) {
						//说明还没有读取结束，pagecount还不能决定
						return false;
					}
					else {
						//结束了
						nPageCount = nPageIndex;

						//要取第一页作为pagesize
						nPageSize = this.m_nForward_tmp_firstpagesize;
						nTotalCount = this.m_nForward_tmp_totalcount;
					}
				}
			}

			//
			if (this.m_nInfo_TotalCount == -1)
				this.m_nInfo_TotalCount = nTotalCount;

			if (this.m_nInfo_PageCount == -1)
				this.m_nInfo_PageCount = nPageCount;

			//2009.08.13 一些评论列表支持线程化，这会导致有些页中的评论数大于预定的pagesize，如果按这样的pagesize计算pagecount就会过少
			//				所以，需要人为的指定pagesize。这会导致pagecount过大，但可以查看到所有的评论了
			//				这时，就需要调整m_nInfo_TotalCount 或 m_nInfo_PageCount。
			var nTmp_PageSize = ctools.getAttribute(oResult, "pagesize", -1);
			if (nTmp_PageSize != -1) {
				if (this.m_nInfo_TotalCount != -1 && this.m_nInfo_PageCount == -1) {
					//pagecount可计算得出
					if (nTmp_PageSize == 0) {
						//2009.08.13 如果缺省为0会引发许多的问题
						//				因为第一页总是要抓取的，所以设为1是很自然的
						this.m_nInfo_PageCount = 1;
					}
					else {
						this.m_nInfo_PageCount = Math.ceil(parseFloat(this.m_nInfo_TotalCount) / parseFloat(nTmp_PageSize));
					}
				}
				else if (this.m_nInfo_TotalCount == -1 && this.m_nInfo_PageCount != -1) {
					//只有等到最后一页取到时才计算
					if (nPageIndex == this.m_nInfo_PageCount) {
						//通过最后一页来获取，应该可以确定所有的信息了
						//pagesize已确定了
						this.m_nInfo_TotalCount = nTmp_PageSize * (this.m_nInfo_PageCount - 1) + nPageSize;
					}
				}
			}

			//2009.08.25 经测试，下面的多极判断中都是=nPageSize,所以，直接在这里赋值即可，
			//				而且也可以判断nTmp_PageSize
			if (this.m_nInfo_PageSize == -1) {
				if (nTmp_PageSize != -1)
					this.m_nInfo_PageSize = nTmp_PageSize;
				else
					this.m_nInfo_PageSize = nPageSize;
			}

			//2009.10.27 调整totalcount 和 pagecount
			//2010.09.06 有的nTmp_PageSize是预定义的，并不是实际的记录条数，所以应该使用nPageSize
			//					仍要判断m_nInfo_PageSize!=-1，为的是指定判断的时机
			//if(this.m_nInfo_TotalCount!=-1 && this.m_nInfo_PageSize!=-1 && this.m_nInfo_TotalCount<this.m_nInfo_PageSize)
			if (this.m_nInfo_TotalCount != -1 && this.m_nInfo_PageSize != -1 && this.m_nInfo_TotalCount < nPageSize) {
				this.m_nInfo_TotalCount = nPageSize; 		//m_nInfo_PageSize;
			}

			//2009.10.27 调整pagecount,总之不能出现等于0的情况
			if (this.m_nInfo_PageCount != -1 && this.m_nInfo_PageCount <= 0) {
				this.m_nInfo_PageCount = 1;
			}

			//判断info，如果有必要的话，还需要再启动一个task来判断
			if (this.m_nInfo_TotalCount == -1 && this.m_nInfo_PageCount == -1) {
				//已经无从判断了，直接将pagecount设为1
				this.m_nInfo_PageCount = 1;

				//当前有多少记录就设置多少
				this.m_nInfo_TotalCount = nPageSize;
			}
			else if (this.m_nInfo_TotalCount == -1) {
				if (this.m_nInfo_PageCount == 1) {
					//只有一页，有多少记录就设置多少
					this.m_nInfo_TotalCount = nPageSize;
				}
				else {
					//说明有多页，
					//因为第一页总是recordsize=pagesize,所以只需最后一页即可
					if (nPageIndex == 1) {
						//totalcount只有等到最后一页取得之后才能计算
						//因为cachemode=forward的情况已处理，这样做也没有问题
						this._addWaitingTask(this.m_nInfo_PageCount);
						bEnd = false;
					}
					else if (nPageIndex == this.m_nInfo_PageCount) {
						//通过最后一页来获取，应该可以确定所有的信息了
						//pagesize已确定了
						this.m_nInfo_TotalCount = this.m_nInfo_PageSize * (this.m_nInfo_PageCount - 1) + nPageSize;
					}
				}
			}
			else if (this.m_nInfo_PageCount == -1) {
				if (this.m_nInfo_TotalCount == nPageSize) {
					//说明只有一页
					this.m_nInfo_PageCount = 1;
				}
				else {
					//说明有多页
					//因为第一页总是recordsize=pagesize,所以可以计算得出
					if (nPageIndex == 1) {
						//pagecount可计算得出
						if (this.m_nInfo_PageSize == 0) {
							//2009.08.13 如果缺省为0会引发许多的问题
							//				因为第一页总是要抓取的，所以设为1是很自然的
							this.m_nInfo_PageCount = 1;
						}
						else {
							this.m_nInfo_PageCount = Math.ceil(parseFloat(this.m_nInfo_TotalCount) / parseFloat(this.m_nInfo_PageSize));
						}
					}
				}
			}
			else {
				//nothing
			}

			//
			return bEnd;
		};

		this._cancreatetask=function(nPageIndex){
			//if -1 ,cannot createtask
			if(nPageIndex==-1)
				return false;

			//
			if(this._getEntitysetCommentsByPageIndex(nPageIndex)!=null)
				return false;

			//cacheMode
			if(this.m_sCacheMode=="forward")
			{
				//must page by page 
				if(nPageIndex>1 && this._getEntitysetCommentsByPageIndex(nPageIndex-1)==null)
					return false;
			}

			//ok
			return true;
		};

		this._shouldCheckInfo=function(){
			return (this.m_nInfo_TotalCount==-1 || this.m_nInfo_PageCount==-1 || this.m_nInfo_PageSize==-1);
		};

		this._getEntitysetCommentsByPageIndex=function(nPageIndex){
			return this.m_oMapEntitysetComments[nPageIndex];
		};

		this._adjustpageindex = function (nPageIndex, bInOut, sShowOrder) {
			//
			var sPageOrderDirection = this.m_sPageOrderDirection;
			var nPageCount = this.m_nInfo_PageCount;

			//
			if ((sShowOrder == "desc" && sPageOrderDirection == "desc")
				||
				(sShowOrder != "desc" && sPageOrderDirection != "desc")
				) {
				if (nPageIndex == -1) {
					if (nPageCount == -1)
						return -1;
					else
						return nPageCount;
				}
				else {
					return nPageIndex;
				}
			}
			else {
				if (nPageIndex == -1) {
					return 1;
				}
				else if (nPageIndex == 1) {
					if (nPageCount == -1)
						return -1;
					else
						return nPageCount;
				}
				else {
					if (nPageCount == -1) {
						//always show the first
						if (bInOut)
							return -1;
						else
							return 1;
					}
					else {
						return nPageCount - nPageIndex + 1;
					}
				}
			}
		};

		this._callback_show = function (nPageIndex, oEntitysetComments, oParams, callback) {
			var oResult = new Object();

			//
			var nPageIndexOut = this._adjustpageindex(nPageIndex, false, oParams["showOrder"]);

			//status
			oResult["status"] = "succeeded";

			//info
			oResult["showOrder"] = oParams["showOrder"];
			oResult["pageIndex"] = nPageIndexOut;
			if (this._shouldCheckInfo()) {
				oResult["totalcount"] = oEntitysetComments.getCount();
				oResult["pagecount"] = 1;
				oResult["pagesize"] = oEntitysetComments.getCount();
			}
			else {
				oResult["totalcount"] = this.m_nInfo_TotalCount;
				oResult["pagecount"] = this.m_nInfo_PageCount;
				oResult["pagesize"] = this.m_nInfo_PageSize;
			}

			//content
			if(oParams["returnRaw"]===true)
				oResult["content"]=oEntitysetComments;
			else
				oResult["content"] = this._combineCommentsText(nPageIndexOut, oEntitysetComments, oResult["showOrder"]);

			//ok
			callback(oResult);
		};

		this._getCounterStart = function (nPageIndexOut, oEntityset, sShowOrder) {
			var sPageOrderDirection = this.m_sPageOrderDirection;

			//
			if (this._shouldCheckInfo()) {
				//as one page
				if (g_sShowOrder == "desc")
					return oEntityset.getCount();
				else
					return 1;
			}
			else {
				//
				var nPageSize = this.m_nInfo_PageSize;
				var nPageCount = this.m_nInfo_PageCount;
				var nTotalCount = this.m_nInfo_TotalCount;

				//
				if (sShowOrder == "desc") {
					if (sPageOrderDirection == "desc") {
						return nTotalCount - nPageSize * (nPageIndexOut - 1);
					}
					else {
						if (nPageIndexOut == 1) {
							return nTotalCount;
						}
						else {
							var nDiff = nPageSize * nPageCount - nTotalCount;
							return nTotalCount - nPageSize * (nPageIndexOut - 1) + nDiff;
						}
					}
				}
				else {
					if (sPageOrderDirection == "desc") {
						if (nPageIndexOut == 1) {
							return 1;
						}
						else {
							var nDiff = nPageSize * nPageCount - nTotalCount;
							return nPageSize * (nPageIndexOut - 1) + 1 - nDiff;
						}
					}
					else {
						return nPageSize * (nPageIndexOut - 1) + 1;
					}
				}
			}
		};

		this._combineCommentsText = function (nPageIndexOut, oEntityset, sShowOrder) {
			var nCounter = this._getCounterStart(nPageIndexOut, oEntityset, sShowOrder);
			return CArticleCommentsTools2.combineCommentsText(nCounter, oEntityset, sShowOrder);
		};

		////
	}

	//////////////////////////////
	function CContentManager(oMain) {
		//properties
		this.m_oMain = oMain;
		this.m_oMapArticleCommentsTools=new Object();

		//method
		this.showPageOuter = function (oParams, callback) {
			var oThis = this;

			//force check if form is ready
			var sFormId = oParams["formId"];
			var oRuntimeInfo = this.m_oMain.m_oFormManager.getRuntimeFormInfo(sFormId);
			if (oRuntimeInfo != null) {
				oThis.__showPageOuter(oParams, callback);
			}
			else {
				//prepare form
				oThis.m_oMain.m_oFeedLinkFormManager._commentsCheckFormId2("", "", "", sFormId, function (bSucceeded, sFormId, nFormMode) {
					if (!bSucceeded || sFormId == "") {
						callback({ status: "failed" });
					}
					else {
						oThis.__showPageOuter(oParams, callback);
					}
				});
			}
		};

		this.__showPageOuter = function (oParams, callback) {
			var nArticleIndex = oParams["articleIndex"];
			var oTools = this.m_oMapArticleCommentsTools[nArticleIndex];
			if (oTools == null) {
				oTools = new CArticleCommentsTools(this.m_oMain);
				//1.
				this.m_oMapArticleCommentsTools[nArticleIndex] = oTools;
				//2. 
				oTools.init(oParams);
			}

			oTools.showPageOuter(oParams, callback);
		};

		this.clearArticleComments = function (nArticleIndex, onresponse) {
			delete this.m_oMapArticleCommentsTools[nArticleIndex];
			onresponse(null);
		};
			
		////
	}
}

var CArticleCommentsTools2 = {
	combineDatetime2: function (oEntity) {
		var oDatetime = this.combineDatetime(oEntity);
		if (!Sys.getAttribute(oEntity, "dateValid", true))
			return oDatetime;
		else
			return String2.format("{0}/{1}/{2} {3}:{4}",
								oDatetime.getMonth() + 1, oDatetime.getDate(), oDatetime.getFullYear(),
								ctools.fixedWidth(oDatetime.getHours(), 2, '0'), ctools.fixedWidth(oDatetime.getMinutes(), 2, '0'));
	},

	combineDatetime: function (oEntity) {
		//check if valid
		if (!Sys.getAttribute(oEntity, "dateValid", true))
			return Sys.getAttribute(oEntity, "date", "");

		//info
		var oDate = oEntity["date"];
		var sTime = Sys.getAttribute(oEntity, "time", "");
		var nTimeDiff = Sys.getAttribute(oEntity, "timediff", 0);

		//check date
		if (oDate == null) {
			oDate = new Date();
		}
		else if (oDate.getFullYear == null) {
			var sDate = oDate.toString().replace(/[年月]/g, '-').replace(/日/g, '');
			var nDate = Date.parse(sDate);
			if (isNaN(nDate)) {
				oDate = new Date();
			}
			else {
				oDate = new Date(nDate);
			}
		}

		//combine
		//oDate may be contain time
		if (!String2.isEmpty(sTime)) {
			var sDate = String2.format("{0}-{1}-{2}", oDate.getFullYear(), oDate.getMonth() + 1, oDate.getDate());

			sDate += " " + sTime;

			var nDate = Date.parse(sDate);

			nDate += nTimeDiff * 60 * 60 * 1000;

			oDate = new Date(nDate);
		}

		//ok
		return oDate;
	},

	adjustContentText: function (sContent) {
		//only adjust plaintext
		if (sContent.indexOf('<') == -1 || sContent.indexOf('>') == -1 || sContent.indexOf('/') == -1) {
			//sContent.replace(/ /g,"&nbsp;");		//if <br /> then <br&nbsp;/>
			sContent.replace(/\n/g, "<br />");
			sContent.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
		}

		return sContent;
	},

	combineCommentsText: function (nCounter, oEntityset, sShowOrder) {
		//begin
		var sHtml_CommentList = "<div style='color:Gray;'>";

		//init
		var bAlternating = false;

		//move
		if (sShowOrder == "desc")
			oEntityset.moveLast();
		else
			oEntityset.moveFirst();


		//loop
		while (true) {
			//
			if ((sShowOrder == "desc" && oEntityset.isBegin())
						||
						(sShowOrder != "desc" && oEntityset.isEnd())
						)
				break;

			//
			var oEntity = oEntityset.getEntityCurrent();

			//style
			var sClassFeedComment;
			if (!bAlternating)
				sClassFeedComment = "padding:4px;";
			else
				sClassFeedComment = "padding:4px;";

			//href
			var sHref = "";
			if (Sys.getAttribute(oEntity, "url", "") != "") {
				sHref = String2.format("href='{0}' target='blank'", ctools.HTMLEncode(oEntity["url"]));
			}
			else {
				sHref = "style='color:Gray;'";
			}

			//datetime
			var sDatetime = this.combineDatetime2(oEntity);

			//avatar
			var sAvatar = Sys.getAttribute(oEntity, "avatar", "");
			if (sAvatar == "")
				sAvatar = cbase.getURL("addons/images/avatar.jpeg");

			//content reply
			var sContent = this.adjustContentText(Sys.getAttribute(oEntity, "content", ""));
			var sReply = this.adjustContentText(Sys.getAttribute(oEntity, "reply", ""));

			//html
			//tr设置样式，避免外层的样式被table中止
			var sHtml_Comment = String2.format("\
					<div style='{0}' id='comment:{1}'>\
						<div><table><tbody><tr style='color:Gray;font-size:12px;'>\
								<td><span>{2}</span>&nbsp;<img src='{3}' height='32' width='32' /></td>\
								<td><a {4} id='comment:author'>{5}</a><br />\
									<span>{6}</span>\</td>\
								</tr></tbody></table>\
						</div>\
						<div style='padding-left:60px;padding-right:20px;padding-top:6px;padding-bottom:6px;color:Black;' id='comment:content'>{7}</div>\
						<div style='padding-left:100px;padding-right:20px;padding-top:6px;padding-bottom:6px;color:Black;'>{8}</div>\
					</div>",
					sClassFeedComment, oEntity["id"], nCounter, sAvatar,
					sHref, oEntity["author"], sDatetime,
					sContent, sReply
					);

			//
			sHtml_CommentList += sHtml_Comment;

			//switch
			bAlternating = !bAlternating;
			nCounter = (sShowOrder == "desc") ? nCounter - 1 : nCounter + 1;

			//next
			if (sShowOrder == "desc")
				oEntityset.movePrevious();
			else
				oEntityset.moveNext();
		}

		//end
		sHtml_CommentList += "</div>";

		//ok
		return sHtml_CommentList;
	}
};



