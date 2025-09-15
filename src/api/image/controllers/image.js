'use strict';

/**
 *  image controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::image.image', ({ strapi }) => ({
  // Crear imagen con almacenamiento local únicamente
  async createLocal(ctx) {
    try {
      const { data } = ctx.request.body;
      const result = await strapi.service('api::image.image').createImageLocal(data);
      
      ctx.body = {
        success: true,
        data: result,
        message: 'Image created and saved to local storage successfully'
      };
    } catch (error) {
      ctx.throw(500, `Error creating image: ${error.message}`);
    }
  },

  // Actualizar imagen con almacenamiento local únicamente
  async updateLocal(ctx) {
    try {
      const { id } = ctx.params;
      const { data, serieId } = ctx.request.body;
      const result = await strapi.service('api::image.image').updateImageLocal(id, data, serieId);
      
      ctx.body = {
        success: true,
        data: result,
        message: 'Image updated in local storage successfully'
      };
    } catch (error) {
      ctx.throw(500, `Error updating image: ${error.message}`);
    }
  }
}));
