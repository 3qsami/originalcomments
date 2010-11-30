
/// <reference path="cbase.js" />

//create content host
var ccontenthost = {

	getTabGuid: function () {
		return null;
	},
	getReaderEventClass: function () {
		return feed_readerOnline_events_viewcomments;
	}
};


//create content
var jq = createJQuery(window);
var ccontent = createContentContext(window, document, jq);
jq(document).ready(function () {
	ccontent.start(ccontenthost);
});
