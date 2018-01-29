const path = require('path');
const _ = require('lodash');
const Stylus = require('stylus');
const CSSO = require('csso');

const fs = require('../utils/fs.js');
const Log = require('../utils/log.js');
const Config = require('../config.js');

const CSS_DIR = path.join(Config.theme, 'css');
const CSS_DIST = path.join(Config.desination, 'css');

module.exports = function(filepath) {
    Log.info(filepath);

    let styles = fs.expand({ filter: 'isFile' }, [
        path.join(CSS_DIR, '**/*'),
        '!' + path.join(CSS_DIR, '**/_*'),
    ]);

    _.each(styles, function(style) {
        let filename = path
            .basename(style)
            .replace(/\s+/, '-')
            .toLowerCase();

        let newStyle = path.join(
            CSS_DIST,
            filename.replace(/\.[\w\d]+/, '.css')
        );

        let content = fs.read(style);

        Stylus(content)
            .set('filename', style)
            .set('paths', [CSS_DIR])
            // .set('linenos',     process.env.NODE_ENV ? false : true)
            // .set('compress',    process.env.NODE_ENV ? true : false)
            .render(function(err, css) {
                if (err) {
                    Log.error(err);
                    return;
                }

                // POST PROCESS CSS A BIT
                css = css
                    .replace(/#__ROOT__/gi, ':root')
                    .replace(/PP__/gi, '--');

                // Write unminified styles to disk
                fs.write(newStyle, css);

                let csso_opts = {
                    debug: process.env.NODE_ENV ? false : true,
                    // ,   c:      process.env.NODE_ENV ? true : false
                };

                css = CSSO.minify(css, csso_opts).css;

                // console.log(css);
                fs.write(`${newStyle}.min.css`, css);

                Log.success(`Compiled ${style}`);
            });
    });
};
