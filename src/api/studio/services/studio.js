'use strict';

/**
 * studio service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::studio.studio');
