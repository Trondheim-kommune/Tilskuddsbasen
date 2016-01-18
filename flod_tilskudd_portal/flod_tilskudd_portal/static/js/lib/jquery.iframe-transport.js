// This [jQuery](https://jquery.com/) plugin implements an `<iframe>`
// [transport](https://api.jquery.com/jQuery.ajax/#extending-ajax) so that
// `$.ajax()` calls support the uploading of files using standard HTML file
// input fields. This is done by switching the exchange from `XMLHttpRequest`
// to a hidden `iframe` element containing a form that is submitted.

// The [source for the plugin](https://github.com/cmlenz/jquery-iframe-transport)
// is available on [Github](https://github.com/) and licensed under the [MIT
// license](https://github.com/cmlenz/jquery-iframe-transport/blob/master/LICENSE).

// ## Usage

// To use this plugin, you simply add an `iframe` option with the value `true`
// to the Ajax settings an `$.ajax()` call, and specify the file fields to
// include in the submssion using the `files` option, which can be a selector,
// jQuery object, or a list of DOM elements containing one or more
// `<input type="file">` elements:

//     $("#myform").submit(function() {
//         $.ajax(this.action, {
//             files: $(":file", this),
//             iframe: true
//         }).complete(function(data) {
//             console.log(data);
//         });
//     });

// The plugin will construct hidden `<iframe>` and `<form>` elements, add the
// file field(s) to that form, submit the form, and process the response.

// If you want to include other form fields in the form submission, include
// them in the `data` option, and set the `processData` option to `false`:

//     $("#myform").submit(function() {
//         $.ajax(this.action, {
//             data: $(":text", this).serializeArray(),
//             files: $(":file", this),
//             iframe: true,
//             processData: false
//         }).complete(function(data) {
//             console.log(data);
//         });
//     });

// ### Response Data Types

// As the transport does not have access to the HTTP headers of the server
// response, it is not as simple to make use of the automatic content type
// detection provided by jQuery as with regular XHR. If you can't set the
// expected response data type (for example because it may vary depending on
// the outcome of processing by the server), you will need to employ a
// workaround on the server side: Send back an HTML document containing just a
// `<textarea>` element with a `data-type` attribute that specifies the MIME
// type, and put the actual payload in the textarea:

//     <textarea data-type="application/json">
//       {"ok": true, "message": "Thanks so much"}
//     </textarea>

// The iframe transport plugin will detect this and pass the value of the
// `data-type` attribute on to jQuery as if it was the "Content-Type" response
// header, thereby enabling the same kind of conversions that jQuery applies
// to regular responses. For the example above you should get a Javascript
// object as the `data` parameter of the `complete` callback, with the
// properties `ok: true` and `message: "Thanks so much"`.

// ### Handling Server Errors

// Another problem with using an `iframe` for file uploads is that it is
// impossible for the javascript code to determine the HTTP status code of the
// servers response. Effectively, all of the calls you make will look like they
// are getting successful responses, and thus invoke the `done()` or
// `complete()` callbacks. You can only communicate problems using the content
// of the response payload. For example, consider using a JSON response such as
// the following to indicate a problem with an uploaded file:

//     <textarea data-type="application/json">
//       {"ok": false, "message": "Please only upload reasonably sized files."}
//     </textarea>

// ### Compatibility

// This plugin has primarily been tested on Safari 5 (or later), Firefox 4 (or
// later), and Internet Explorer (all the way back to version 6). While I
// haven't found any issues with it so far, I'm fairly sure it still doesn't
// work around all the quirks in all different browsers. But the code is still
// pretty simple overall, so you should be able to fix it and contribute a
// patch :)

// ## Annotated Source

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// WARNING: The original library has been altered for tilskudd!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Got a SCRIPT5 "access denied" in the jquery iframe code used on the client
// With IE 11 in windows 8.1 (and it could apply to other combinations of Microsoft browser/OSes) when uploading
// file too big (in which case the app returns a 413 server side).
//
// Could not identify how to fix this issue without altering this file.
//
// The following potential problem sources where considered:
// * Same origin policy (http://en.wikipedia.org/wiki/Same-origin_policy).
// Same origin policy is only supposed to create trouble when one uses different document.domains in the page and
// iframe. We have debugged the values of document.domain inside and outside of the iframes and they are equal, so
// same origin policy should be enforced.
// * Connection reset by server. The application server (flask app running in nginx) will return a 413 is set up
// to abort uploads when the files are too big. It could be creating some issues on the client side, but we did not
// find a valid approach to find out if it was or wasn´t the source of the problem.
//
// We experimented various hacks on this file just to see if it made a difference. We sat different values to
// the iframe´s src to force setting the document.domain
// * src="javascript:false;" (standard library value)
// * src="about:blank"
// * src=""
// * a javascript script based on document.open/document.write/document.close to force setting document.domain
//
// Another experiment was to initialise the iframe differently:
// * create it with src=""
// * add it to the document
// * update its src to the correct value on the first "load" event
//
// None of those attempts were successful.
//
// The weidest observation is that when lowering the limit at which 413 gets returned by the server to something
// small (5-10Mo) and uploading files just slightly bigger than the limit ie will once in a while let the iframe access
// this.contentWindow.document instead of throwing an "access denied" as it more or less always does on big files.
// The fact that the exact same client code behaves differently with "small" and "big" files over the limit is puzzling
//
// For files which receive a 413 on upload we see that this.contentWindow.location similar to (from the debugger):
// ﻿{
//  [functions]: ,
//  hash: "",
//  host: "172.16.11.1:8080",
//  hostname: "172.16.11.1",
//  href: "http://172.16.11.1:8080/api/sak/v1/vedlegg/",
//  origin: "http://172.16.11.1:8080",
//  pathname: "/api/sak/v1/vedlegg/",
//  port: "8080",
//  protocol: "http:",
//  search: ""
// }
//
// while we get something totally different on SCRIPT5 "access denied" errors:
// ﻿{
//    [functions]: ,
//    hash: "#http://172.16.11.1:8080/api/sak/v1/vedlegg/",
//    host: "ieframe.dll",
//    hostname: "ieframe.dll",
//    href: "res://ieframe.dll/dnserrordiagoff.htm#http://172.16.11.1:8080/api/sak/v1/vedlegg/",
//    origin: "res://ieframe.dll",
//    pathname: "/dnserrordiagoff.htm",
//    port: "",
//    protocol: "res:",
//    search: ""
// }
//
// It is unknown why IE has this weird ieframe.dll location when SCRIPT5 error occurs, and also unknown what
// dnserrordiagoff is/represents.
//
// The current hack (marked with comment "IE FIX" in the code) relies on catching the possible exception and returning
// an error. This makes it possible to manage this error, even if we cannot say anything about what went wrong.


(function ($, undefined) {
    "use strict";

    // Register a prefilter that checks whether the `iframe` option is set, and
    // switches to the "iframe" data type if it is `true`.
    $.ajaxPrefilter(function (options, origOptions, jqXHR) {
        if (options.iframe) {
            options.originalURL = options.url;
            return "iframe";
        }
    });

    // Register a transport for the "iframe" data type. It will only activate
    // when the "files" option has been set to a non-empty list of enabled file
    // inputs.
    $.ajaxTransport("iframe", function (options, origOptions, jqXHR) {
        var form = null,
            iframe = null,
            name = "iframe-" + $.now(),
            files = $(options.files).filter(":file:enabled"),
            markers = null,
            accepts = null;

        // This function gets called after a successful submission or an abortion
        // and should revert all changes made to the page to enable the
        // submission via this transport.
        function cleanUp() {
            files.each(function (i, file) {
                var $file = $(file);
                $file.data("clone").replaceWith($file);
            });
            form.remove();
            iframe.one("load", function () {
                iframe.remove();
            });
            iframe.attr("src", "javascript:false;");
        }

        // Remove "iframe" from the data types list so that further processing is
        // based on the content type returned by the server, without attempting an
        // (unsupported) conversion from "iframe" to the actual type.
        options.dataTypes.shift();

        // Use the data from the original AJAX options, as it doesn't seem to be
        // copied over since jQuery 1.7.
        // See https://github.com/cmlenz/jquery-iframe-transport/issues/6
        options.data = origOptions.data;

        if (files.length) {
            form = $("<form enctype='multipart/form-data' method='post'></form>").
                hide().attr({action: options.originalURL, target: name});

            // If there is any additional data specified via the `data` option,
            // we add it as hidden fields to the form. This (currently) requires
            // the `processData` option to be set to false so that the data doesn't
            // get serialized to a string.
            if (typeof(options.data) === "string" && options.data.length > 0) {
                $.error("data must not be serialized");
            }
            $.each(options.data || {}, function (name, value) {
                if ($.isPlainObject(value)) {
                    name = value.name;
                    value = value.value;
                }
                $("<input type='hidden' />").attr({name: name, value: value}).
                    appendTo(form);
            });

            // Add a hidden `X-Requested-With` field with the value `IFrame` to the
            // field, to help server-side code to determine that the upload happened
            // through this transport.
            $("<input type='hidden' value='IFrame' name='X-Requested-With' />").
                appendTo(form);

            // Borrowed straight from the JQuery source.
            // Provides a way of specifying the accepted data type similar to the
            // HTTP "Accept" header
            if (options.dataTypes[0] && options.accepts[options.dataTypes[0]]) {
                accepts = options.accepts[options.dataTypes[0]] +
                    (options.dataTypes[0] !== "*" ? ", */*; q=0.01" : "");
            } else {
                accepts = options.accepts["*"];
            }
            $("<input type='hidden' name='X-HTTP-Accept'>").
                attr("value", accepts).appendTo(form);

            // Move the file fields into the hidden form, but first remember their
            // original locations in the document by replacing them with disabled
            // clones. This should also avoid introducing unwanted changes to the
            // page layout during submission.
            markers = files.after(function (idx) {
                var $this = $(this),
                    $clone = $this.clone().prop("disabled", true);
                $this.data("clone", $clone);
                return $clone;
            }).next();
            files.appendTo(form);

            return {

                // The `send` function is called by jQuery when the request should be
                // sent.
                send: function (headers, completeCallback) {
                    iframe = $("<iframe src='javascript:false;' name='" + name +
                        "' id='" + name + "' style='display:none'></iframe>");

                    // The first load event gets fired after the iframe has been injected
                    // into the DOM, and is used to prepare the actual submission.
                    iframe.one("load", function () {

                        // The second load event gets fired when the response to the form
                        // submission is received. The implementation detects whether the
                        // actual payload is embedded in a `<textarea>` element, and
                        // prepares the required conversions to be made in that case.
                        iframe.one("load", function () {
                            //////////////////////////////
                            // IE FIX START (try/catch) //
                            //////////////////////////////
                            try {
                                // verify that we can access contentWindow.document
                                var assertAccessNotDenied = this.contentWindow.document;
                            } catch (exception) {
                                console.error("Could not access 'this.contentWindow'. logging this, document and contentWindow...");
                                console.error(this);
                                console.error(document);
                                console.error(this.contentWindow);
                                // IE Fix
                                // SCRIPT5 Access denied seems to occur once in a while when trying to access "this.contentWindow
                                // As far as we know only an IE 11 error.
                                // If the exception occurs we try to recover and present the user with some info.
                                cleanUp();
                                var msg = "Bruker du internet explorer? Prøv gjerne å laste opp i en annen browser!";
                                completeCallback(
                                    200,
                                    "OK",
                                    {   html: "<head></head><body>{\"status\": 400, \"__error__\": \"" + msg + "\"}</body>",
                                        text: "{\"status\": 400, \"__error__\": \"" + msg + "\"}"
                                    },
                                    null);
                                return;
                            }
                            ////////////////////////////
                            // IE FIX END (try/catch) //
                            ////////////////////////////

                            var doc = this.contentWindow ? this.contentWindow.document :
                                    (this.contentDocument ? this.contentDocument : this.document),
                                root = doc.documentElement ? doc.documentElement : doc.body,
                                textarea = root.getElementsByTagName("textarea")[0],
                                type = textarea && textarea.getAttribute("data-type") || null,
                                status = textarea && textarea.getAttribute("data-status") || 200,
                                statusText = textarea && textarea.getAttribute("data-statusText") || "OK",
                                content = {
                                    html: root.innerHTML,
                                    text: type ?
                                        textarea.value :
                                        root ? (root.textContent || root.innerText) : null
                                };
                            cleanUp();
                            completeCallback(status, statusText, content, type ?
                                ("Content-Type: " + type) :
                                null);
                        });

                        // Now that the load handler has been set up, submit the form.
                        form[0].submit();
                    });

                    // After everything has been set up correctly, the form and iframe
                    // get injected into the DOM so that the submission can be
                    // initiated.
                    $("body").append(form, iframe);
                },

                // The `abort` function is called by jQuery when the request should be
                // aborted.
                abort: function () {
                    if (iframe !== null) {
                        iframe.unbind("load").attr("src", "javascript:false;");
                        cleanUp();
                    }
                }

            };
        }
    });

})(jQuery);
