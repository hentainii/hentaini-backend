'use strict';

module.exports = ({ strapi }) => ({
  
  validateCommentContent(content) {
    const errors = [];

    if (!content || typeof content !== 'string') {
      errors.push('El contenido es requerido');
      return errors;
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length < 3) {
      errors.push('El contenido debe tener al menos 3 caracteres');
    }

    if (trimmedContent.length > 1000) {
      errors.push('El contenido no puede exceder 1000 caracteres');
    }

    // Validar contenido spam básico
    const spamPatterns = [
      /(.)\1{10,}/, // Repetición excesiva de caracteres
      /https?:\/\/[^\s]+\s+https?:\/\/[^\s]+/gi, // Múltiples enlaces
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(trimmedContent)) {
        errors.push('El contenido parece ser spam');
        break;
      }
    }

    return errors;
  },

  async checkRateLimit(userId, timeWindow = 60000, maxComments = 5) {
    const since = new Date(Date.now() - timeWindow);
    
    const recentComments = await strapi.entityService.count('api::comment.comment', {
      filters: {
        author: userId,
        createdAt: {
          $gte: since.toISOString()
        }
      }
    });

    return recentComments < maxComments;
  }

});