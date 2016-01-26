#!/usr/bin/env node

/**
 * @update 18/01/16.
 */
var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    argv = require('minimist')(process.argv.slice(2));

if (argv.help || argv.h) {
    console.log('--port xxx           The port to listen on.');
    console.log('--upload-dir xxx     The directory to upload to.');
    console.log('--upload-method xxx  The method to catch.');
} else {

    var port = argv.port || 8989;
    var uploadDir = argv['upload-dir'] || './';
    var uploadUrl = '/upload';


    http.createServer(function (req, res) {
        if (req.url == uploadUrl) {
            // parse a file upload
            var form = new formidable.IncomingForm({
                uploadDir: uploadDir,
                multiples: true
            });

            form.parse(req, function (err, fields, files) {

                if (!err) {

                    if (!Array.isArray(files.upload)) {
                        files.upload = [files.upload];
                    }

                    files.upload.forEach(function (file) {
                        fs.renameSync(file.path, path.join(uploadDir, file.name));
                        console.log("Files uploaded: " + file.name);
                    });

                    res.writeHead(200, {
                        'content-type': 'text/html'
                    });
                    res.end('<h1>Files uploaded</h1>');

                } else {
                    res.end(err);
                    console.error(err);
                }

            });

            return;
        }

        // show a file upload form
        res.writeHead(200, {
            'content-type': 'text/html'
        });
        res.end(
            '<form action="/upload" enctype="multipart/form-data" method="post">' +
            '<input type="file" name="upload" multiple="multiple"><br>' +
            '<input type="submit" value="Upload">' +
            '</form>'
        );
    }).listen(port);

    console.log('Listening on port:' + port);
    console.log('Upload dir:' + uploadDir);
    console.log('Upload url:' + uploadUrl);

}