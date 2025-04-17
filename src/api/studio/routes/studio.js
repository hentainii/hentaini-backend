'use strict';

/**
 * studio router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::studio.studio');
