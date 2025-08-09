'use strict';

/**
 * serie-rating controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rating.rating', ({ strapi }) => ({
  // Obtener rating de una serie con estadísticas
  async getSerieRating(ctx) {
    try {
      const { serieId } = ctx.params;
      const userId = ctx.state.user?.id;

      // Obtener todos los ratings de la serie
      const ratings = await strapi.entityService.findMany('api::rating.rating', {
        filters: {
          serie: serieId
        },
        populate: ['user', 'serie']
      });

      // Calcular estadísticas
      const totalVotes = ratings.length;
      const averageRating = totalVotes > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalVotes 
        : 0;

      // Buscar rating del usuario actual
      const userRating = userId 
        ? ratings.find(rating => rating.user.id === userId)?.rating || null
        : null;

      ctx.body = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalVotes,
        userRating
      };
    } catch (error) {
      ctx.throw(500, 'Error al obtener rating de la serie');
    }
  },

  // Crear o actualizar rating de usuario
  async setUserRating(ctx) {
    try {
      const { serieId } = ctx.params;
      const { rating, userId } = ctx.request.body;

      if (!userId) {
        return ctx.unauthorized('Debes estar autenticado para votar');
      }

      if (!rating || rating < 1 || rating > 5) {
        return ctx.badRequest('El rating debe ser un número entre 1 y 5');
      }

      // Buscar rating existente del usuario para esta serie
      const existingRating = await strapi.entityService.findMany('api::rating.rating', {
        filters: {
          user: userId,
          serie: serieId
        }
      });

      let result;
      if (existingRating.length > 0) {
        // Actualizar rating existente
        result = await strapi.entityService.update('api::rating.rating', existingRating[0].id, {
          data: {
            rating
          }
        });
      } else {
        // Crear nuevo rating
        result = await strapi.entityService.create('api::rating.rating', {
          data: {
            rating,
            user: userId,
            serie: serieId
          }
        });
      }

      ctx.body = {
        success: true,
        message: 'Rating actualizado exitosamente',
        data: result
      };
    } catch (error) {
      ctx.throw(500, 'Error al guardar rating');
    }
  }
}));
