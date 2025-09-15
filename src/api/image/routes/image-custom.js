'use strict';

/**
 * image router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    // Rutas personalizadas para almacenamiento local
    {
      method: 'POST',
      path: '/images/create-local',
      handler: 'api::image.image.createLocal',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/images/update-local/:id',
      handler: 'api::image.image.updateLocal',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};
