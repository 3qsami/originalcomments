
/// <reference path="cbase.js" />

//create content host
var ccontenthost = {

	getTabGuid: function () {
		return null;
	},
	getReaderEventClass: function () {
		return feed_readerOnline_events_googlereader;
	}
};


//create content
var jq = createJQuery(window);
var ccontent = createContentContext(window, document, jq);
//2010.12.19 need not check ready event
//jq(document).ready(function () {
	ccontent.start(ccontenthost);
//});


