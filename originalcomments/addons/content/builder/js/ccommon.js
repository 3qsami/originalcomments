/*!
* Original Comments for Google Reader
* http://code.google.com/p/originalcomments/
*
* Copyright (C) 2010, Kevin, licensed MPL
*/

// url

var URL_Feed_WebCalls_createguid = "http://www.pimshell.com/formgallery/WebCalls.aspx?action=createguid";
var URL_Feed_FormDownload = "http://www.pimshell.com/formgallery/Download.aspx";

// url

var URL_Feed_WebCalls_checkloginstatus = "http://www.pimshell.com/formgallery/WebCalls.aspx?action=checkloginstatus";
var URL_Feed_Signin = "http://www.pimshell.com/formgallery/signin.aspx";
var URL_Feed_FormPost = "http://www.pimshell.com/formgallery/Post.aspx";


//	var URL_Feed_WebCalls_checkloginstatus = "http://localhost:49448/WebCalls.aspx?action=checkloginstatus";
//	var URL_Feed_Signin = "http://localhost:49448/signin.aspx";
//	var URL_Feed_FormPost = "http://localhost:49448/Post.aspx";
//	

// common

var ccommon = {
	importform: function (sFormId, callback) {
		var sURL;
		if (sFormId.indexOf(".pxml") > -1)
			sURL = sFormId;
		else
			sURL = String2.format("{0}?FormId={1}", URL_Feed_FormDownload, sFormId);

		var oParams = new Object();
		oParams["noCache"] = true;
		XMLHttpManager.openRequest2(sURL, oParams, function (oRequest) {
			//
			if (oRequest.status == 200) {
				_importFromPXML(oRequest.responseText);
				callback(true);
			}
			else {
				callback(false);
			}
		});
	},
	createguid: function (callback) {
		XMLHttpManager.openRequest2(URL_Feed_WebCalls_createguid, null, function (oRequest) {
			if (oRequest.status != 200) {
				callback(null);
			}
			else {
				var oResult = cbase.json_parse(oRequest.responseText);
				callback(oResult.result);
			}
		});
	}
	
};


//
function _getOptionsForms() {
	var oForms = cbase.getoption("builder.forms", null);
	if (oForms == null) {
		oForms = new Object();
	}
	return oForms;
}
function _setOptionsForms(oForms) {
	cbase.setoption("builder.forms", oForms);
}
function _getFormContent(sFormId) {
	var oFormContent = cbase.getoption("builder.form.content:" + sFormId, null);
	if (oFormContent == null) {
		oFormContent = new Object();
	}
	return oFormContent;
}
function _setFormContent(oFormContent) {
	cbase.setoption("builder.form.content:" + oFormContent["formId"], oFormContent);
}
function _removeFormContent(sFormId) {
	cbase.removeoption("builder.form.content:" + sFormId);
}

//
function _getFieldValueForForm(oNodeFields, sFieldName) {
	var s = String2.format("field[@name=\"{0}\"]", sFieldName);
	return ctools.getNodeText(ctools.selectSingleNode(oNodeFields, s));
}

function _importFromPXML(sResponseText) {
	var oForms = _getOptionsForms();
	var bChanged = false;

	//
	var oRoot = ctools.nodeFromXML(sResponseText);
	if (oRoot != null) {
		var oNodeItems = ctools.selectSingleNode(oRoot, "plugins/plugin[@guid=\"{00000000-0000-0000-0002-000000000008}\"]/entities/entity[@index=\"0\"]/items");
		if (oNodeItems != null) {
			//loop
			var oNodeItem = oNodeItems.firstChild;
			while (oNodeItem != null) {
				if (oNodeItem.nodeName == "item") {
					var oNodeFields = ctools.selectSingleNode(oNodeItem, "fields");
					if (oNodeFields != null) {
						//formId
						var sFormId = oNodeItem.getAttribute("itemId");
						var sFormVersion = _getFieldValueForForm(oNodeFields, "Version");

						//check form exsis and old
						var oFormInfo = oForms[sFormId];
						if (oFormInfo == null || oFormInfo["Version"].toString() < sFormVersion) {
							if (oFormInfo == null) {
								oFormInfo = new Object();
								oFormInfo["CreateTime"] = new Date();

								oForms[sFormId] = oFormInfo;
							}

							oFormInfo["formId"] = sFormId;

							oFormInfo["ItemTitle"] = _getFieldValueForForm(oNodeFields, "ItemTitle");
							oFormInfo["ModifiedTime"] = new Date();
							oFormInfo["Version"] = sFormVersion;
							oFormInfo["ReleaseTime"] = _getFieldValueForForm(oNodeFields, "ReleaseTime");
							oFormInfo["Publisher"] = _getFieldValueForForm(oNodeFields, "Publisher");
							oFormInfo["Email"] = _getFieldValueForForm(oNodeFields, "Email");
							oFormInfo["Homepage"] = _getFieldValueForForm(oNodeFields, "Homepage");
							oFormInfo["Description"] = _getFieldValueForForm(oNodeFields, "Description");
							oFormInfo["FormType"] = _getFieldValueForForm(oNodeFields, "FormType");
							oFormInfo["FormParam1"] = _getFieldValueForForm(oNodeFields, "FormParam1");
							oFormInfo["FormParam2"] = _getFieldValueForForm(oNodeFields, "FormParam2");

							var oFormContent = _getFormContent(sFormId);
							oFormContent["formId"] = sFormId;
							oFormContent["FormHTM"] = _getFieldValueForForm(oNodeFields, "FormHTM");
							oFormContent["FormXML"] = _getFieldValueForForm(oNodeFields, "FormXML");
							oFormContent["FormJS"] = _getFieldValueForForm(oNodeFields, "FormJS");

							//2011.06.19
							oFormContent["testreg_regexp"] = _getFieldValueForForm(oNodeFields, "testreg_regexp");
							oFormContent["testreg_result"] = _getFieldValueForForm(oNodeFields, "testreg_result");
							oFormContent["testreg_text"] = _getFieldValueForForm(oNodeFields, "testreg_text");
							oFormContent["debug_articlelink"] = _getFieldValueForForm(oNodeFields, "debug_articlelink");

							//
							_setFormContent(oFormContent);

							//
							bChanged = true;
						}
						else {
							//so as to lead to top
							oFormInfo["ModifiedTime"] = new Date();

							//
							bChanged = true;
						}
					}
				}

				//next
				oNodeItem = oNodeItem.nextSibling;
			}
		}
	}

	if (bChanged) {
		_setOptionsForms(oForms);
		
		//2011.08.07 移到外部
		//_fillformlist(oForms);
	}

	return bChanged;
}
