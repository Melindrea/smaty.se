'use strict';
module.exports.siteTitle = function (title) {
    var siteTitle = this.options.site.title,
        titleSeparator = this.options.site.titleSeparator;
    if (this.context.src.name === 'index' || title === undefined) {
        return siteTitle;
    }

    return title + ' ' + titleSeparator + ' ' + siteTitle;
};
