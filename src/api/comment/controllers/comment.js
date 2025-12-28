'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({

  // Sobrescribir find para incluir conteo de respuestas
  async find(ctx) {
    const { query } = ctx;

    const [entries, count] = await Promise.all([
      strapi.entityService.findMany('api::comment.comment', {
        ...query,
        populate: {
          author: true,
          reply: true,
          liked_by: true,
          image: true,
          parent: true
        }
      }),
      strapi.entityService.count('api::comment.comment', {
        filters: query.filters
      })
    ]);

    // Agregar conteo de respuestas a cada comentario
    if (entries) {
      for (const comment of entries) {
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

    const sanitizedEntity = await this.sanitizeOutput(entries, ctx);

    // Construct pagination metadata
    const page = Number(query.pagination?.page) || 1;
    const pageSize = Number(query.pagination?.pageSize) || 25;

    return this.transformResponse(sanitizedEntity, {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(count / pageSize),
        total: count
      }
    });
  },

  // Sobrescribir create para manejar notificaciones y límites
  async create(ctx) {
    try {
      const userId = ctx.state.user?.id;

      // Manejar multipart/form-data vs JSON
      let requestData = ctx.request.body.data;
      if (ctx.is('multipart') && typeof requestData === 'string') {
        try {
          requestData = JSON.parse(requestData);
        } catch (e) {
          strapi.log.error('Error parsing multipart data:', e);
          return ctx.badRequest('Datos inválidos');
        }
      } else {
        requestData = requestData || ctx.request.body;
      }

      if (!userId) {
        return ctx.unauthorized('Debes estar autenticado para comentar');
      }

      // Límite de imágenes por hora (10 por hora)
      let files = ctx.request.files;
      // Strapi a veces pone los files en una estructura diferente dependiendo de la versión/plugin upload
      // En core controller multipart, deberíamos tener acceso en ctx.request.files

      // Ajuste para detectar si hay imagen en los archivos subidos
      // Nota: cuando se usa el upload plugin, el campo suele llamarse 'files.image' o similar si asociamos directo
      // Pero aquí chequeamos si hay ANY file para la key 'image'
      // Cuando form data viene con files.image, en koa-body/strapi files suele ser objeto con key 'files.image' o 'image'
      const hasImage = files && (files.image || files['files.image']);

      const content = requestData?.content?.trim();
      
      // Si no hay imagen, el contenido es requerido y min 3 chars
      if (!hasImage) {
        if (!content || content.length < 3) {
          return ctx.badRequest('El contenido es requerido (mínimo 3 caracteres)');
        }
      }

      if (content && content.length > 1000) {
        return ctx.badRequest('El contenido no puede exceder 1000 caracteres');
      }

      // Bloquear URLs y enlaces (http, https, www, dominios .tld) si hay contenido
      const urlRegex = /(https?:\/\/|www\.)\S+|\b[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?/i;
      if (content && urlRegex.test(content)) {
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

      const DAILY_LIMIT = 15; // Aumentado a 15 según código original
      if (todayCount >= DAILY_LIMIT) {
        return ctx.forbidden(`Has alcanzado el límite de ${DAILY_LIMIT} comentarios por día`);
      }

      // Límite de imágenes por hora (10 por hora)
      if (hasImage) {
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const hourlyImageCount = await strapi.entityService.count('api::comment.comment', {
          filters: {
            author: userId,
            is_deleted: false,
            createdAt: {
              $gte: oneHourAgo.toISOString()
            },
            image: {
              $null: false
            }
          }
        });

        const HOURLY_IMAGE_LIMIT = 10;
        if (hourlyImageCount >= HOURLY_IMAGE_LIMIT) {
          return ctx.forbidden(`Has alcanzado el límite de ${HOURLY_IMAGE_LIMIT} imágenes por hora`);
        }
      }

      // Preparar body para super.create
      // Si es multipart, Strapi necesita que 'data' sea un string JSON si es compleja, 
      // pero si modificamos requestData, necesitamos re-serializarlo o dejarlo si era objeto
      // Lo más seguro es inyectar nuestros campos forzados en el objeto y luego reestructurar ctx.request.body

      const enforcedFields = {
        author: userId,
        likes: 0,
        is_edited: false,
        is_deleted: false
      };

      if (ctx.is('multipart')) {
        // En multipart, body.data es string (normalmente)
        // Ya lo parseamos en requestData
        const newData = { ...requestData, ...enforcedFields };
        ctx.request.body.data = JSON.stringify(newData);
        // Los files ya están en ctx.request.files, no necesitamos tocarlos
      } else {
        // En JSON normal
        ctx.request.body = {
          data: { ...requestData, ...enforcedFields }
        };
      }

      const response = await super.create(ctx);
      return response;
    } catch (error) {
      strapi.log.error('Error creando comentario:', error);
      return ctx.internalServerError('Error interno del servidor');
    }
  }

}));