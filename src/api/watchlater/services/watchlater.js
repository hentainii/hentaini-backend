'use strict';

/**
 * watchlater service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::watchlater.watchlater');
