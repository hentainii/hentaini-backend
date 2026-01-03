'use strict';

/**
 * A set of functions called "actions" for `landing-data`
 * This funcion return 10 carousel series, 20 episodes and 25 series
 * @returns {Object} - An object with 3 properties: carouselSeries, episodes and series
 */


module.exports = {
  getLandingData: async (_) => {
    
    const carouselSeries = await strapi.entityService.findMany('api::serie.serie', {
      populate: ['images', 'images.image_type', 'genreList', 'status'],
      filters: {
        featured: true,
      },
      sort: 'createdAt:desc',
      limit: 10,
    });

    const episodes = await strapi.entityService.findMany('api::episode.episode', {
      filters: {
        visible: true
      },
      populate: ['image', 'image.image_type', 'serie', 'serie.status'],
      sort: 'createdAt:desc',
      limit: 20,
    });

    const series = await strapi.entityService.findMany('api::serie.serie', {
      populate: ['images', 'images.image_type', 'status'],
      sort: 'createdAt:desc',
      limit: 24,
    });

    const results = {
      carouselSeries,
      episodes,
      series,
    }

    return results;
  }
};
