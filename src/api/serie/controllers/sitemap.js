'use strict';
const fs = require('fs')
/**
 * A set of functions called "actions" for `dxclient`
 */
module.exports = {
  async savesitemap(ctx) {
    const input = ctx.request.body
    console.log(input)
    fs.writeFileSync('./public/sitemap.xml', input.sitemap)
  },
};