function pretty_date(tokenAgo,tokenFromNow, formats) {
	this.m_tokenAgo = tokenAgo;
	this.m_tokenFromNow = tokenFromNow;
	this.m_formats = cbase.json_parse(formats);

	this.convert = function (oDate) {
		var seconds = (new Date() - new Date(oDate)) / 1000,
			token = this.m_tokenAgo,
			i = 0,
			format;

		if (seconds < 0) {
			seconds = Math.abs(seconds);
			token = this.m_tokenFromNow;
		}

		while (format = this.m_formats[i++]) {
			if (seconds < format[0]) {
				if (format.length == 2) {
					return format[1] + ' ' + token;
				} else {
					return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
				}
			}
		}

		return oDate;
	};
}



