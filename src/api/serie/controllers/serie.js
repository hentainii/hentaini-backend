'use strict';

/**
 *  serie controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::serie.serie', ({ strapi }) => ({
  async find(ctx) {
    // Llamar al método find original
    const { data, meta } = await super.find(ctx);
    
    // Para cada serie, calcular el newUpdatedAt basado en el último episodio
    const seriesWithNewUpdatedAt = await Promise.all(
      data.map(async (serie) => {
        // Buscar el episodio más reciente de esta serie
        const latestEpisode = await strapi.entityService.findMany('api::episode.episode', {
          filters: {
            serie: serie.id
          },
          sort: { updatedAt: 'desc' },
          limit: 1
        });
        
        // Si hay episodios, usar el updatedAt del más reciente, sino usar el de la serie
        const newUpdatedAt = latestEpisode.length > 0 
          ? latestEpisode[0].updatedAt 
          : serie.updatedAt;
        
        return {
          ...serie,
          newUpdatedAt
        };
      })
    );
    
    return {
      data: seriesWithNewUpdatedAt,
      meta
    };
  }
}));
