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
function feed_readerOnline_events_viewcomments(window,document,jq) {

	////	-- methods
	this.initialize = function () { };

	this.dispose = function () { };

	this.prepare1 = function (callback) {
		//clientId is empty
		callback(true, ""); 
	};
	this.prepare2 = function (callback) {
		callback(true);
	};

	//		-- functions
	this.ongetcurrentarticle = function (e) {
		var oEntry = ctools.getFirstJQElement(jq("#current-article"));
		if (oEntry != null) {
			var oa = ctools.getFirstJQElement(jq("#article-title-link", oEntry));
			if (oa != null) {
				e.articleElement = oEntry;
				e.articleLink = oa.href;
				e.articleTitle = ctools.getInnerText(oa);
				e.formId = ctools.getAttribute(oa, "_formId", "");

				//
				e.returnValue = true;
			}
		}
	};

	this.onappendcommentscontainer = function (e) {
		var oArticleElement = e.articleElement;
		var oCommentsContainer = e.commentscontainer;

		var oArticleBody = ctools.getFirstJQElement(jq("#article-body", oArticleElement));
		if (oArticleBody == null)
			oArticleElement.appendChild(oCommentsContainer);
		else
			oArticleBody.appendChild(oCommentsContainer);

		e.cancelBubble = true;
	};

	this.ongetcommentscontainer = function (e) {
		var oArticleElement = e.articleElement;

		var oCommentsContainer = null;

		var oArticleBody = ctools.getFirstJQElement(jq("#article-body", oArticleElement));
		if (oArticleBody == null)
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_advancedcomments", oArticleElement));
		else
			oCommentsContainer = ctools.getFirstJQElement(jq("#pimshell_advancedcomments", oArticleBody));

		e.returnValue = oCommentsContainer;
		e.cancelBubble = true;
	};

	this.oncommentscontainerready = function (e) {
		var oCommentsContainer = e.commentscontainer;
		jq("#cmd_trackComments_img", oCommentsContainer).css("display", "none");
		jq("#cmd_trackComments", oCommentsContainer).css("display", "none");
	}

	this.ongetoption = function (e) {
		var sName = e.name;
		var oValue = e.value;

		if (sName == "autoview_enabled") {
			e.returnValue = true;
			e.cancelBubble = true;
		}
		else if (sName == "debug_enabled") {
			e.returnValue = true;
			e.cancelBubble = true;
		}
	}
}

////	Reader Online Events -- end	
///////////////////////////////////////////////////////////////