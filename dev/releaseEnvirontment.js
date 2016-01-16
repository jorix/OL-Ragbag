/* Copyright 2012-2016 by Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license. */

/**
 * Class: releaseEnvironment
 *
 * Loads OpenLayers from 2.9 to 2.13.1 and dev releases and can choose between
 *     the compressed version or lib and add patches or not.
 *
 * THIS CODE IS ONLY INTENDED TO HELP MAKE TESTS AND DEBUGGING.
 */
/**
 * Constructor: releaseEnvironment
 *
 * Loads selected OpenLayers release as instructed in URL parameters.
 *
 * URL parameters:
 *  - release: "dev", "2.13.1" ... "2.9"
 *  - lib: Use lib for debug (true if `lib` parameter exists in the URL)
 *  - patch: Use aditional sources on `patches` option (true if `patch`
 *      parameter exists in the URL)
 *
 * Parameters:
 * options - {Object}
 *
 * Valid options:
 * defaults - {Object} To determine the default values without any URL
 *      parameters: `release`, `lib`, `patch`.
 * patches - Array({String})|{Object} List of sources patch or object with
 *      pairs: key + list patches as array.
 *
 * Example 1:
 * (code)
 *  <title>My title</title>
 *  <script>
 *      var release = new releaseEnvironment({
 *          defaults: {patch: true},
 *          patches: ['myPatch-1.js', 'myPatch-2.js']
 *      });
 *      release.writeScripts();
 *  </script>
 *  ...
 *  <h1 id="title">??</h1>
 *  <div id="environmentForm"></div>
 *  <script>
 *      release.writeSelectionForm('environmentForm', 'title');
 *  </script>
 * (end)
 *
 * Example 2:
 * (code)
 *  ...
 *  <script>
 *      var release = new releaseEnvironment({
 *          defaults: {patch: 'myPatch'},
 *          patches: {yourPatch:['yourPatch'],
 *                    myPatch: ['myPatch-1.js', 'myPatch-2.js']}
 *      });
 *      release.writeScripts();
 *  </script>
 *  ...
 * (end)
 */
function releaseEnvironment(options) {
    options = options || {};
    var defaults = options.defaults || {};

    // private vars
    var iHref = window.location.href.split('#')[0].split('?')[0],
        iSearch = window.location.search,
        // Default js values
        iRelease = defaults.release ? defaults.release : 'dev',
        iPatch = defaults.patch,
        iLib = !!defaults.lib,
        // Available patches
        iPatches = options.patches,
        // Work
        iTitleText,
        iSufTitle,
        iUrlCanonical;

    // releases
    var releases = {
        'dev': 'http://dev.openlayers.org',
        '2.13.1': 'http://dev.openlayers.org/releases/OpenLayers-2.13.1',
        '2.12': 'http://dev.openlayers.org/releases/OpenLayers-2.12',
        '2.11': 'http://dev.openlayers.org/releases/OpenLayers-2.11',
        '2.10': 'http://dev.openlayers.org/releases/OpenLayers-2.10',
        '2.9': 'http://dev.openlayers.org/releases/OpenLayers-2.9'
    };

    // Parse URL parameters
    var _getUrl = function(release, lib, patch) {
        var patchParam = '';
        if (iPatches && patch) {
            if (iPatches instanceof Array) {
                patchParam = '&patch=y';
            } else {
                patchParam = '&patch=' + patch;
            }
        }
        var url = iHref +
            '?release=' + release + (lib ? '&lib=y' : '') + patchParam +
            window.location.hash;
        return url;
    };
    
    // Get script folder location
    var _getScriptFolder = function() {
        var pattern = /(^|.*?\/)releaseEnvirontment\.js(\?|$)/i,
            scripts = document.getElementsByTagName('script'),
            folder = '';
        for (var i=0, len=scripts.length; i<len; i++) {
            var src = scripts[i].getAttribute('src');
            if (src) {
                var matches = src.match(pattern);
                if (matches) {
                    folder = matches[1];
                    break;
                }
            }
        }
        return folder;
    };

    if (iSearch) {
        var regRelease = /&*release=([\w\.]+)&?.*/i,
            regPatch = /&*patch=(\w+)&?.*/i,
            regLib = /&*lib=(\w+)&?.*/i,
            res;
        res = regRelease.exec(iSearch);
        iRelease = res ? res[1] : 'dev';
        iPatch = regPatch.exec(iSearch);
        iPatch = iPatch ? iPatch[1] : false;
        iLib = !!regLib.exec(iSearch);
    }

    // Mormalizing parameters.
    if (iPatches) {
        if (iPatches instanceof Array) {
            iPatch = !!iPatch;
        } else {
            iPatch = iPatches[iPatch] ? iPatch : '';
        }
    }
    iRelease = releases[iRelease] ? iRelease : 'dev';

    // Set title sufix and url canonical
    iSufTitle = iRelease +
                (iLib ? '(lib)' : '') +
                (iPatch ?
                    (iPatch === true ? ' + patch' : ' + patch=' + iPatch) :
                    '');
    iUrlCanonical = _getUrl(iRelease, iLib, iPatch);

    // set title
    var wrk;
    try {
        wrk = document.getElementsByTagName('TITLE')[0];
        iTitleText = wrk.innerHTML + ' "' + iSufTitle + '"';
        wrk.innerHTML = iTitleText;
    } catch (err) {
    }

    /**
     * Method: writeScripts
     * Write the scripts of the selected OL release.
     */
    this.writeScripts = function() {
        var urlOL = releases[iRelease];

        var scripts = [
            '<!-- Release environtment: "' + iSufTitle +
                                '", URL canonical: "' + iUrlCanonical + '" -->',
            '<link rel="stylesheet" href="' + urlOL +
                                   '/theme/default/style.css" type="text/css">',
            '<link rel="stylesheet" href="' + urlOL +
                                         '/examples/style.css" type="text/css">'
        ];
        if (iLib) {
            scripts.push('<script src="' + urlOL +
                                               '/lib/OpenLayers.js"></script>');
        } else {
            scripts.push('<script src="' + urlOL + '/OpenLayers.js"></script>');
        }
        document.write(scripts.join('\n'));

        if (iPatch && iPatches) {
            var _patchesScripts = [];
            var patchesArray = (iPatches instanceof Array) ?
                                iPatches :
                                iPatches[iPatch];
            if (patchesArray) {
                for (var i = 0, len = patchesArray.length; i < len; i++) {
                    _patchesScripts.push('<script src="' + patchesArray[i] +
                                                                 '"></script>');
                }
            }
            if (iLib) {
                this._writePatchesScripts = function(){
                    document.write(_patchesScripts.join('\n'));
                };
                window.releaseEnvironment_instance = this;
                document.write(
                    '<script src="' +
                        _getScriptFolder() +
                        'releaseEnvirontment_writePatches.js"></script>'
                );
            } else {
                document.write(_patchesScripts.join('\n'));
            }
        }
    }

    /**
     * Method: writeSelectionForm
     * Write the selection release form.
     *
     * Parameters:
     * formDivId - {String} Id of the element that will contain the form.
     * titleDivId - {String} Id of the element that will contain the body title.
     */
    this.writeSelectionForm = function(formDivId, titleDivId) {
        var wrk;
        if (titleDivId) {
            wrk = document.getElementById(titleDivId);
            if (wrk) {
                if (iTitleText) {
                    wrk.innerHTML = iTitleText;
                } else {
                    wrk.innerHTML += ' "' + iSufTitle + '"';
                }
            }
        }

        // Auxiliar functions
        var addChk = function(form, name, title, checked) {
            var element = document.createElement('input');
            element.type = 'checkbox';
            element.value = 'on'; //IE ?
            addField(form, name, title, true, element);
            // IE9 ussing compatibility mode requires set to checked after
            //     adding chk to the form :-(
            if (checked) {
                element.checked = 'checked';
            }
            return element;
        };
        var addSelect = function(form, name, title, nullable, list, selected) {
            var wrk,
                fSelect = document.createElement('select');
            if (nullable) {
                wrk = document.createElement('option');
                wrk.value = '';
                wrk.innerHTML = '(no)';
                if (!selected) {wrk.selected = 'selected';}
                fSelect.appendChild(wrk);
            }
            for (var r in list) {
                wrk = document.createElement('option');
                wrk.value = r;
                wrk.innerHTML = r;
                if (r === selected) {wrk.selected = 'selected';}
                fSelect.appendChild(wrk);
            }
            addField(form, name, title, false, fSelect);
            return fSelect;
        };
        var addField = function(form, name, title, post, element) {
            form.appendChild(document.createTextNode(' \u00a0 '));
            element.id = 'form_' + name;
            element.name = 'form_' + name;
            var wrk = document.createElement('label');
            if (!post) {
                wrk.appendChild(document.createTextNode(title + ' '));
            }
            wrk.appendChild(element);
            if (post) {
                wrk.appendChild(document.createTextNode(title));
            }
            form.appendChild(wrk);
        };

        // Create form
        var form = document.createElement('form');
        form.innerHTML = '<input type="submit" value =" Switch to: ">';

        // create form controls
        var fReleases, fLib, fPatch;
        if (iPatches) {
            if (iPatches instanceof Array) {
                fPatch = addChk(form, 'patch', 'patch', iPatch);
            } else {
                fPatch = addSelect(
                            form, 'patch', 'patch', true, iPatches, iPatch);
            }
        }
        fReleases = addSelect(
                       form, 'release', 'release ', false, releases, iRelease);
        fLib = addChk(form, 'lib', 'OL lib debug', iLib);
        // link
        wrk = document.createElement('a');
        wrk.href = iUrlCanonical;
        wrk.innerHTML = iSufTitle;
        form.appendChild(document.createTextNode(' \u00a0 \u00bb '));
        form.appendChild(wrk);

        form.onsubmit = function() {
            var patchParam = '';
            if (iPatches) {
                if (iPatches instanceof Array) {
                    patchParam = fPatch.checked;
                } else {
                    patchParam = fPatch.value;
                }
            }
            window.location.assign(
                            _getUrl(fReleases.value, fLib.checked, patchParam));
            return false;
        };

        // Add form to div
        var formDiv = document.getElementById(formDivId);
        formDiv.appendChild(form);
    };

}
