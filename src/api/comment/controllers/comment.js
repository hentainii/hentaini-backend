'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  
  // Sobrescribir find para incluir conteo de respuestas
  async find(ctx) {
    const { query } = ctx;

    const entity = await strapi.entityService.findMany('api::comment.comment', {
      ...query,
      populate: {
        author: true,
        reply: true,
        liked_by: true,
        ...query.populate
      }
    });

    // Agregar conteo de respuestas a cada comentario
    if (entity.data) {
      for (const comment of entity.data) {
        const repliesCount = await strapi.entityService.count('api::comment.comment', {
          filters: {
            reply: comment.id,
            is_deleted: false
          }
        });
        
        // Agregar el conteo según la estructura (con o sin attributes)
        if (comment.attributes) {
          comment.attributes.repliesCount = repliesCount;
        } else {
          comment.repliesCount = repliesCount;
        }
      }
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Sobrescribir create para manejar notificaciones (opcional)
  async create(ctx) {
    const response = await super.create(ctx);
    
    // Aquí podrías agregar lógica para notificaciones
    // cuando alguien comenta en un episodio, etc.
    
    return response;
  }

}));