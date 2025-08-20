'use strict';

/**
 *  image controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::image.image', ({ strapi }) => ({
  // Obtener estadísticas de migración
  async getMigrationStatus(ctx) {
    try {
      const stats = await strapi.service('api::image.image').getMigrationStats();
      const processStatus = await strapi.service('api::image.image').getProcessStatus();
      
      ctx.body = {
        success: true,
        data: {
          stats,
          process: processStatus
        }
      };
    } catch (error) {
      ctx.throw(500, `Error getting migration status: ${error.message}`);
    }
  },

  // Obtener imágenes pendientes de migración
  async getPendingMigration(ctx) {
    try {
      const { page = 1, limit = 25, status } = ctx.query;
      const result = await strapi.service('api::image.image').getPendingImages({
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });
      
      ctx.body = {
        success: true,
        data: result.data,
        meta: result.meta,
        stats: result.stats
      };
    } catch (error) {
      ctx.throw(500, `Error getting pending images: ${error.message}`);
    }
  },

  // Iniciar proceso de migración
  async startMigration(ctx) {
    try {
      const { batchSize = 10, retryFailedOnly = false } = ctx.request.body;
      const processId = await strapi.service('api::image.image').startMigrationProcess({
        batchSize,
        retryFailedOnly
      });
      
      ctx.body = {
        success: true,
        data: {
          processId,
          message: 'Migration process started successfully'
        }
      };
    } catch (error) {
      ctx.throw(500, `Error starting migration: ${error.message}`);
    }
  },

  // Pausar proceso de migración
  async pauseMigration(ctx) {
    try {
      await strapi.service('api::image.image').pauseMigrationProcess();
      
      ctx.body = {
        success: true,
        message: 'Migration process paused successfully'
      };
    } catch (error) {
      ctx.throw(500, `Error pausing migration: ${error.message}`);
    }
  },

  // Reanudar proceso de migración
  async resumeMigration(ctx) {
    try {
      await strapi.service('api::image.image').resumeMigrationProcess();
      
      ctx.body = {
        success: true,
        message: 'Migration process resumed successfully'
      };
    } catch (error) {
      ctx.throw(500, `Error resuming migration: ${error.message}`);
    }
  },

  // Reintentar migración de imagen específica
  async retryImageMigration(ctx) {
    try {
      const { id } = ctx.params;
      const result = await strapi.service('api::image.image').retryImageMigration(id);
      
      ctx.body = {
        success: true,
        data: result,
        message: 'Image migration retry initiated'
      };
    } catch (error) {
      ctx.throw(500, `Error retrying image migration: ${error.message}`);
    }
  }
}));
