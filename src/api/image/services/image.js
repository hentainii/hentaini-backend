'use strict';

/**
 * image service.
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::image.image', ({ strapi }) => ({
  // Crear imagen con almacenamiento local únicamente
  async createImageLocal(imageData) {
    try {
      // Crear la imagen en la base de datos (almacenamiento local)
      const createdImage = await strapi.entityService.create('api::image.image', {
        data: {
          ...imageData,
          publishedAt: Date.now()
        }
      });
      
      const image = await strapi.entityService.findOne('api::image.image', createdImage.id);
      
      strapi.log.info(`Image ${image.id} saved successfully to local storage`);
      return image;
    } catch (error) {
      throw new Error(`Failed to create image: ${error.message}`);
    }
  },

  // Actualizar imagen con almacenamiento local únicamente
  async updateImageLocal(imageId, imageData, serieId = null) {
    try {
      // Actualizar la imagen en la base de datos (almacenamiento local)
      const updatedImage = await strapi.entityService.update('api::image.image', imageId, {
        data: imageData
      });
      
      const image = await strapi.entityService.findOne('api::image.image', imageId, {
        populate: ['image_type', 'series']
      });
      
      // Si se proporcionó serieId o la imagen está asociada a series, actualizar referencias en episodios
      const targetSerieId = serieId || (image.series && image.series.length > 0 ? image.series[0].id : null);
      if (targetSerieId) {
        await this.updateEpisodeImageReferences(imageId, targetSerieId);
      }
      
      strapi.log.info(`Image ${imageId} updated successfully in local storage`);
      return image;
    } catch (error) {
      throw new Error(`Failed to update image: ${error.message}`);
    }
  },

  // Actualizar referencias de imagen en episodios cuando se actualiza el screenshot de una serie
  async updateEpisodeImageReferences(imageId, serieId) {
    try {
      // Obtener la imagen actualizada con sus relaciones
      const image = await strapi.entityService.findOne('api::image.image', imageId, {
        populate: ['image_type', 'series']
      });

      // Verificar si es una imagen de tipo screenshot y está asociada a una serie
      if (image && image.image_type && image.image_type.name === 'screenshot' && serieId) {
        strapi.log.info(`Updating episode image references for serie ${serieId} with new screenshot image ${imageId}`);
        
        // Buscar todos los episodios de la serie que no tienen screenshot personalizado
        const episodesToUpdate = await strapi.entityService.findMany('api::episode.episode', {
          filters: {
            serie: serieId,
            $or: [
              { hasCustomScreenshot: { $null: true } },
              { hasCustomScreenshot: false }
            ]
          }
        });

        // Actualizar cada episodio para que apunte a la nueva imagen
        const updatePromises = episodesToUpdate.map(episode => 
          strapi.entityService.update('api::episode.episode', episode.id, {
            data: {
              image: imageId
            }
          })
        );

        await Promise.all(updatePromises);
        
        strapi.log.info(`Updated ${episodesToUpdate.length} episodes with new screenshot image reference`);
        return {
          success: true,
          updatedEpisodes: episodesToUpdate.length,
          message: `Updated ${episodesToUpdate.length} episodes with new screenshot reference`
        };
      }
      
      return {
        success: true,
        updatedEpisodes: 0,
        message: 'No episode updates needed - not a screenshot image or no serie association'
      };
    } catch (error) {
      strapi.log.error(`Error updating episode image references: ${error.message}`);
      throw new Error(`Failed to update episode image references: ${error.message}`);
    }
  }
}));
