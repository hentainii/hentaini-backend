'use strict';

module.exports = async (policyContext, config, { strapi }) => {
  const { params, state } = policyContext;
  const userId = state.user?.id;

  if (!userId) {
    return false;
  }

  // Para admins, permitir siempre
  if (state.user.role?.type === 'admin') {
    return true;
  }

  // Verificar si es el autor del comentario
  const comment = await strapi.entityService.findOne('api::comment.comment', params.id, {
    populate: {
      author: true
    }
  });

  if (!comment) {
    return false;
  }

  // Verificar propiedad según estructura
  const authorId = comment?.author?.data?.id || comment.author?.id;
  return authorId === userId;
};