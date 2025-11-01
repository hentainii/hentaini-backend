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
    try {
      const userId = ctx.state.user?.id;
      const body = ctx.request.body;

      if (!userId) {
        return ctx.unauthorized('Debes estar autenticado para comentar');
      }

      const content = body?.data?.content?.trim();
      if (!content || content.length < 3) {
        return ctx.badRequest('El contenido es requerido (mínimo 3 caracteres)');
      }
      if (content.length > 1000) {
        return ctx.badRequest('El contenido no puede exceder 1000 caracteres');
      }

      // Bloquear URLs y enlaces (http, https, www, dominios .tld)
      const urlRegex = /(https?:\/\/|www\.)\S+|\b[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?/i;
      if (urlRegex.test(content)) {
        return ctx.badRequest('No se permiten enlaces ni URLs en los comentarios');
      }

      // Límite diario de 15 comentarios por usuario
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const todayCount = await strapi.entityService.count('api::comment.comment', {
        filters: {
          author: userId,
          is_deleted: false,
          createdAt: {
            $gte: startOfDay.toISOString(),
            $lt: endOfDay.toISOString()
          }
        }
      });

      const DAILY_LIMIT = 10;
      if (todayCount >= DAILY_LIMIT) {
        return ctx.forbidden(`Has alcanzado el límite de ${DAILY_LIMIT} comentarios por día`);
      }

      // Forzar el autor al usuario autenticado, ignorando lo que venga del cliente
      ctx.request.body = {
        ...body,
        data: {
          ...body?.data,
          author: userId,
          likes: 0,
          is_edited: false,
          is_deleted: false
        }
      };

      const response = await super.create(ctx);
      return response;
    } catch (error) {
      strapi.log.error('Error creando comentario:', error);
      return ctx.internalServerError('Error interno del servidor');
    }
  }

}));