/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/


/// <reference path="../js/cbase.js" />
/// <reference path="../js/ctools.js" />

///////////////////////////////////////////////////////////////
////	Reader Online Events -- begin

////		-- class
function feed_readerOnline_events_googlereader(window,document,jq) {
	////	-- variables
	this.m_sResponseText = "";
	this.m_oFeedInfo = null;

	////	-- methods
	this.initialize = __initialize;
	this.dispose = __dispose;
	this.prepare1 = __prepare1;
	this.prepare2 = __prepare2;

	//		-- functions
	this.ongetcurrentarticle = __ongetcurrentarticle;
	this.onappendcommentscontainer = __onappendcommentscontainer;
	this.ongetcommentscontainer = __ongetcommentscontainer;
	this.onappendcommentsbuttonscontainer = __onappendcommentsbuttonscontainer;
	this.ongetcommentsbuttonscontainer = __ongetcommentsbuttonscontainer;
	this.ongetparentscrollcontainer = __ongetparentscrollcontainer;

	this._getcurrententry = __getcurrententry;
	this._getcurrentfeed = __getcurrentfeed;
	this._adjustlink = __adjustlink;

	this._getcurrentfeed1 = __getcurrentfeed1;
	this._getcurrentfeed2 = __getcurrentfeed2;
	this._getFeedLinkByTitle = __getFeedLinkByTitle;

	//dispose
	function __dispose() {
	}

	//initialize
	function __initialize() {
	}

	//prepare1
	function __prepare1(callback) {
		var oThis = this;

		//cbase.getPlatForm(); 可能不同的platform需要不同的访问方式
		jq.ajax({
			type: "get",
			url: document.URL,
			complete: function (oRequest, textStatus) {
				if (oRequest.status != 200) {
					//try again after 10 seconds
					window.setTimeout(function () { oThis.prepare1(callback); }, 1000 * 10);
				}
				else {
					//
					oThis.m_sResponseText = oRequest.responseText;

					//parse _USER_EMAIL
					var r = oThis.m_sResponseText.match(/_USER_EMAIL\s*?=\s*?"([^"]*?)"/i);
					if (r == null || String2.isEmpty(r[1])) {
						callback(false, null);
					}
					else {
						callback(true, r[1]);
					}
				}
			}
		});
	}

	//prepare2
	function __prepare2(callback) {
		//parse feed info
		var r = this.m_sResponseText.match(/var\s*?_STREAM_LIST_SUBSCRIPTIONS\s*?=\s*?(\{[\s\S]*?\]\});/i);
		if (r == null || r[1] == null){
			//no matter
			callback(true);
		} else {
			try {
				var oInfo = cbase.json_parse(r[1]);
				if (oInfo == null) {
					//no matter
					callback(true);
				}
				else {
					this.m_oFeedInfo = oInfo;
					callback(true);
				}
			} 
			catch (e) {
				//no matter
				callback(true);
			}
		}
	}

	//
	function __ongetparentscrollcontainer(e) {
		e.returnValue = ctools.getFirstJQElement(jq("#entries"));
		e.cancelBubble = true;
	}

	//
	function __onappendcommentsbuttonscontainer(e) {
		var oArticleElement = e.articleElement;
		var oCommentsContainer = e.commentscontainer;
		
		var oArticleBody = ctools.getFirstJQElement(jq("div.entry-actions", oArticleElement));
		if (oArticleBody == null)
			oArticleElement.appendChild(oCommentsContainer);
		else
			oArticleBody.appendChild(oCommentsContainer);

		e.cancelBubble = true;
	};

	function __ongetcommentsbuttonscontainer(e) {
		var oArticleElement = e.articleElement;

		var oCommentsContainer = null;

		var oArticleBody = ctools.getFirstJQElement(jq("div.entry-actions", oArticleElement));
		if (oArticleBody == null)
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_commentsbuttonscontainer", oArticleElement));
		else
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_commentsbuttonscontainer", oArticleBody));

		e.returnValue = oCommentsContainer;
		e.cancelBubble = true;
	};

	//
	function __onappendcommentscontainer(e) {
		var oArticleElement = e.articleElement;
		var oCommentsContainer=e.commentscontainer;

		var oActions = ctools.getFirstJQElement(jq("div.entry-actions", oArticleElement));
		if (oActions == null)
			oArticleElement.appendChild(oCommentsContainer);
		else
			oActions.appendChild(oCommentsContainer);

		e.cancelBubble = true;
	}

	function __ongetcommentscontainer(e) {
		var oArticleElement = e.articleElement;

		var oCommentsContainer=null;

		var oActions = ctools.getFirstJQElement(jq("div.entry-actions", oArticleElement));
		if(oActions==null)
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_advancedcomments", oArticleElement));
		else
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_advancedcomments", oActions));

		e.returnValue = oCommentsContainer;
		e.cancelBubble = true;
	}

	//
	function __ongetcurrentarticle(e) {
		var oEntryInfo = this._getcurrententry();
		if (oEntryInfo != null) {
			//entry
			e.articleElement = oEntryInfo[0];
			e.articleLink = oEntryInfo[1];
			e.articleTitle = oEntryInfo[2];

			//feed
			var oFeedInfo = this._getcurrentfeed(e.articleElement);
			if (oFeedInfo != null) {
				e.feedElement = oFeedInfo[0];
				e.feedLink = oFeedInfo[1];
				e.feedTitle = oFeedInfo[2];
			}

			//	
			e.returnValue = true;
		}

	}

	function __getcurrententry(oArticleElement) {
		var oEntry = ctools.getFirstJQElement(jq("#current-entry"));
		if (oEntry != null) {
			var oa = ctools.getFirstJQElement(jq("a.entry-title-link", oEntry));
			if (oa != null) {
				var oArray = new Array();
				oArray[0] = oEntry;
				oArray[1] = this._adjustlink(oa.href);
				oArray[2] = ctools.getInnerText(oa);

				return oArray;
			}
		}

		return null;
	}

	function __getcurrentfeed(oArticleElement) {
		var oArray = this._getcurrentfeed1();
		if (oArray == null) {
			oArray = this._getcurrentfeed2(oArticleElement);
		}

		return oArray;
	}

	function __getcurrentfeed1() {
		var oFeed = ctools.getFirstJQElement(jq("#chrome-title"));
		if (oFeed != null) {
			var oa = ctools.getFirstJQElement(jq("a:first-child", oFeed));
			if (oa != null) {
				var oArray = new Array();
				oArray[0] = oFeed;
				oArray[1] = this._adjustlink(oa.href); 	//for example: /reader/shared/
				oArray[2] = ctools.getInnerText(oa).replace(/»/, '');

				return oArray;
			}
		}

		return null;
	}

	function __getcurrentfeed2(oArticleElement) {
		var oFeed = ctools.getFirstJQElement(jq("span.entry-source-title", oArticleElement));
		if (oFeed != null) {
			var sTitle=ctools.getInnerText(oFeed);
			var sLink=this._getFeedLinkByTitle(sTitle);
			if(!String2.isEmpty(sLink)) {
				var oArray = new Array();
				oArray[0] = null;
				oArray[1] = sLink;
				oArray[2] = sTitle;			
				return oArray;
			}
		}

		return null;
	}

	function __getFeedLinkByTitle(sTitle) {
		if (this.m_oFeedInfo != null) {
			var oArray=this.m_oFeedInfo.subscriptions;
			if(oArray!=null){
				for (var i = 0; i < oArray.length; i++) {
					var oFeed = oArray[i];
					if (oFeed["title"] == sTitle) {
						return this._adjustlink(oFeed["htmlUrl"]);
					}
				}
			}
		}

		return "";
	}

	function __adjustlink(sLink) {
		var sResult = ctools.combineUrl(sLink, "http://www.google.com/");
		return sResult;
	}

	//
	this.ongetoption = function (e) {
		var sName = e.name;
		var oValue = e.value;

		//
		if (sName == "autoview_enabled") {
			e.returnValue = false;
			e.cancelBubble = true;
		}
	}
}

////	Reader Online Events -- end	
///////////////////////////////////////////////////////////////