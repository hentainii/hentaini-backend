'use strict';

/**
 * serie-rating router.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::rating.rating', {
  routes: [
    // Rutas personalizadas para serie ratings
    {
      method: 'GET',
      path: '/ratings/serie/:serieId',
      handler: 'rating.getSerieRating',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/ratings/serie/:serieId',
      handler: 'rating.setUserRating',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
});
