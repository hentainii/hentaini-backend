'use strict';

/**
 * reaction service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::reaction.reaction');
