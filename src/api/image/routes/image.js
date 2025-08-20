'use strict';

/**
 * image router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [ 
    // Rutas personalizadas para migración
    {
      method: 'GET',
      path: '/images/migration-status',
      handler: 'api::image.image.getMigrationStatus',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/images/pending-migration',
      handler: 'api::image.image.getPendingMigration',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/images/start-migration',
      handler: 'api::image.image.startMigration',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/images/pause-migration',
      handler: 'api::image.image.pauseMigration',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/images/resume-migration',
      handler: 'api::image.image.resumeMigration',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/images/:id/retry-migration',
      handler: 'api::image.image.retryImageMigration',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
