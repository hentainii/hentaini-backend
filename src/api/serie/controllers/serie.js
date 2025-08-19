'use strict';

/**
 *  serie controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::serie.serie', ({ strapi }) => ({
  async find(ctx) {
    // Validar y sanitizar la query
    await this.validateQuery(ctx);
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);
    
    // Obtener las series usando el servicio
    const { results, pagination } = await strapi
      .service('api::serie.serie')
      .find(sanitizedQueryParams);
    
    // Para cada serie, calcular el newUpdatedAt basado en el último episodio
    const seriesWithNewUpdatedAt = await Promise.all(
      results.map(async (serie) => {
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
    
    // Sanitizar la salida
    const sanitizedResults = await this.sanitizeOutput(seriesWithNewUpdatedAt, ctx);
    
    // Transformar la respuesta usando el formato estándar de Strapi
    return this.transformResponse(sanitizedResults, { pagination });
  }
}));
