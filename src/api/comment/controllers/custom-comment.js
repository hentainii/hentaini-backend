'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({
  
  /**
   * Crear respuesta a un comentario
   * POST /api/comments/:id/reply
   */
  async createReply(ctx) {
    try {
      const { id: parentId } = ctx.params;
      const userId = ctx.state.user?.id;
      
      // Manejar multipart/form-data vs JSON
      let requestBody = ctx.request.body; // En JSON es todo el body, en multipart es body.data (string o objeto) + files
      
      let content;
      let files = ctx.request.files;

      if (ctx.is('multipart')) {
        let parsedData = requestBody.data;
        if (typeof parsedData === 'string') {
          try {
            parsedData = JSON.parse(parsedData);
          } catch (e) {
            return ctx.badRequest('Datos inválidos');
          }
        }
        content = parsedData?.content;
        requestBody = parsedData;
      } else {
        content = requestBody.content;
      }

      // Validaciones
      if (!userId) {
        return ctx.unauthorized('Debes estar autenticado para responder');
      }

      // Check for image
      const hasImage = files && (files.image || files['files.image']);

      if (hasImage) {
        // Validación de peso (5MB)
        const imageFile = files.image || files['files.image'];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
        if (imageFile.size > MAX_SIZE) {
           return ctx.badRequest('La imagen no puede exceder los 5MB');
        }
      }

      const trimmed = (content || '').trim();
      
      if (!hasImage) {
        if (!trimmed || trimmed.length < 3) {
          return ctx.badRequest('El contenido de la respuesta es requerido (mínimo 3 caracteres)');
        }
      }

      if (trimmed.length > 1000) {
        return ctx.badRequest('El contenido no puede exceder 1000 caracteres');
      }

      // Bloquear URLs y enlaces en respuestas
      const urlRegex = /(https?:\/\/|www\.)\S+|\b[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?/i;
      if (trimmed && urlRegex.test(trimmed)) {
        return ctx.badRequest('No se permiten enlaces ni URLs en las respuestas');
      }

      // Límite diario de 15 publicaciones (comentarios + respuestas)
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
      const DAILY_LIMIT = 15; // Corregido a 15 para consistencia
      if (todayCount >= DAILY_LIMIT) {
        return ctx.forbidden(`Has alcanzado el límite de ${DAILY_LIMIT} comentarios por día`);
      }

      // Verificar que el comentario padre existe
      const parentComment = await strapi.entityService.findOne('api::comment.comment', parentId);
      if (!parentComment) {
        return ctx.notFound('Comentario padre no encontrado');
      }

      // Crear la respuesta
      const replyData = {
        content: trimmed,
        comment_type: parentComment.comment_type,
        content_id: parentComment.content_id,
        author: userId,
        reply: parentId, // Relación con el comentario padre
        likes: 0,
        is_edited: false,
        is_deleted: false,
        publishedAt: new Date()
      };

      // Preparar argumentos para create
      const createArgs = {
        data: replyData,
        populate: {
          author: true,
          reply: true,
          liked_by: true,
          image: true
        }
      };

      if (hasImage) {
         // Ajustar la estructura de archivos para strapi entity service
         // Si es multipart, Strapi suele esperar los files en un objeto separado 'files'
         // donde la key coincide con el nombre del campo en el modelo ('image')
         // Si hasImage es el file object, lo asignamos.
         
         // Nota: En Core Controller 'create', Strapi maneja esto automáticamente si pasamos ctx.
         // Aquí usamos entityService, que requiere pasar 'files' explícitamente.
         // 'files' debe ser un objeto { field: file }
         
         createArgs.files = {
            image: hasImage // hasImage contiene el file object
         };
      }

      const reply = await strapi.entityService.create('api::comment.comment', createArgs);

      ctx.send({
        data: reply,
        meta: {
          message: 'Respuesta creada exitosamente'
        }
      });

    } catch (error) {
      strapi.log.error('Error creando respuesta:', error);
      ctx.internalServerError('Error interno del servidor');
    }
  },

  /**
   * Obtener respuestas de un comentario
   * GET /api/comments/:id/replies
   */
  async getReplies(ctx) {
    try {
      const { id: parentId } = ctx.params;
      const { page = 1, pageSize = 10 } = ctx.query;

      // Verificar que el comentario padre existe
      const parentComment = await strapi.entityService.findOne('api::comment.comment', parentId);
      if (!parentComment) {
        return ctx.notFound('Comentario no encontrado');
      }

      // Obtener respuestas con paginación
      const replies = await strapi.entityService.findMany('api::comment.comment', {
        filters: {
          reply: parentId,
          is_deleted: false
        },
        populate: {
          author: true,
          liked_by: true,
          image: true
        },
        sort: { createdAt: 'asc' },
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });

      ctx.send(replies);

    } catch (error) {
      strapi.log.error('Error obteniendo respuestas:', error);
      ctx.internalServerError('Error interno del servidor');
    }
  },

  /**
   * Toggle like en un comentario
   * POST /api/comments/:id/like
   */
  async toggleLike(ctx) {
    try {
      const { id: commentId } = ctx.params;
      const userId = ctx.state.user?.id;

      // Validaciones
      if (!userId) {
        return ctx.unauthorized('Debes estar autenticado para dar like');
      }

      // Obtener el comentario con los usuarios que dieron like
      const comment = await strapi.entityService.findOne('api::comment.comment', commentId, {
        populate: {
          liked_by: true,
          author: true
        }
      });

      if (!comment) {
        return ctx.notFound('Comentario no encontrado');
      }

      if (comment.is_deleted) {
        return ctx.badRequest('No puedes dar like a un comentario eliminado');
      }

      // Verificar si el usuario ya dio like
      const likedByUsers = comment.liked_by || [];
      const userLikedIndex = likedByUsers.findIndex(user => user.id === userId);
      const hasLiked = userLikedIndex !== -1;

      let updatedLikedBy;
      let newLikesCount;

      if (hasLiked) {
        // Remover like
        updatedLikedBy = likedByUsers.filter(user => user.id !== userId);
        newLikesCount = Math.max(0, (comment.likes || 0) - 1);
      } else {
        // Agregar like
        updatedLikedBy = [...likedByUsers, { id: userId }];
        newLikesCount = (comment.likes || 0) + 1;
      }

      // Actualizar el comentario
      const updatedComment = await strapi.entityService.update('api::comment.comment', commentId, {
        data: {
          likes: newLikesCount,
          liked_by: updatedLikedBy.map(user => user.id)
        },
        populate: {
          author: true,
          liked_by: true,
          reply: true
        }
      });

      ctx.send({
        data: updatedComment,
        meta: {
          liked: !hasLiked,
          likesCount: newLikesCount,
          message: hasLiked ? 'Like removido' : 'Like agregado'
        }
      });

    } catch (error) {
      strapi.log.error('Error toggle like:', error);
      ctx.internalServerError('Error interno del servidor');
    }
  },

  /**
   * Obtener estadísticas de un comentario
   * GET /api/comments/:id/stats
   */
  async getCommentStats(ctx) {
    try {
      const { id: commentId } = ctx.params;

      const comment = await strapi.entityService.findOne('api::comment.comment', commentId, {
        populate: {
          liked_by: true
        }
      });

      if (!comment) {
        return ctx.notFound('Comentario no encontrado');
      }

      // Contar respuestas
      const repliesCount = await strapi.entityService.count('api::comment.comment', {
        filters: {
          reply: commentId,
          is_deleted: false
        }
      });

      const stats = {
        id: commentId,
        likes: comment.likes || 0,
        likedByCount: comment.liked_by?.length || 0,
        repliesCount,
        isDeleted: comment.is_deleted || false,
        isEdited: comment.is_edited || false
      };

      ctx.send({
        data: stats
      });

    } catch (error) {
      strapi.log.error('Error obteniendo estadísticas:', error);
      ctx.internalServerError('Error interno del servidor');
    }
  }

}));