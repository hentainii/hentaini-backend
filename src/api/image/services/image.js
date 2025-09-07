'use strict';

/**
 * image service.
 */

const { createCoreService } = require('@strapi/strapi').factories;


module.exports = createCoreService('api::image.image', ({ strapi }) => ({
  // Estado del proceso de migración
  migrationProcess: {
    isRunning: false,
    isPaused: false,
    processId: null,
    startedAt: null,
    pausedAt: null,
    batchSize: 10,
    currentBatch: 0,
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    retryFailedOnly: false
  },

  // Obtener estadísticas de migración
  async getMigrationStats() {
    const totalImages = await strapi.entityService.count('api::image.image');
    const migratedImages = await strapi.entityService.count('api::image.image', {
      filters: {
        cf_path: { $notNull: true }
      }
    });
    const pendingImages = await strapi.entityService.count('api::image.image', {
      filters: {
        cf_path: { $null: true },
        path: { $notNull: true }
      }
    });
    const failedImages = await strapi.entityService.count('api::image-migration-stat.image-migration-stat', {
      filters: {
        migration_status: 'failed'
      }
    });

    return {
      total: totalImages,
      migrated: migratedImages,
      pending: pendingImages,
      failed: failedImages,
      progress: totalImages > 0 ? Math.round((migratedImages / totalImages) * 100) : 0
    };
  },

  // Obtener estado del proceso
  async getProcessStatus() {
    return {
      ...this.migrationProcess,
      uptime: this.migrationProcess.startedAt ? Date.now() - this.migrationProcess.startedAt : 0
    };
  },

  // Obtener imágenes pendientes
  async getPendingImages({ page = 1, limit = 25, status = null }) {
    const offset = (page - 1) * limit;
    
    let filters = {
      path: { $notNull: true }
    };

    if (status === 'pending') {
      filters.cf_path = { $null: true };
    } else if (status === 'migrated') {
      filters.cf_path = { $notNull: true };
    } else if (status === 'failed') {
      filters.migration_stats = {
        migration_status: 'failed'
      };
    } else {
      // Por defecto, mostrar solo pendientes
      filters.cf_path = { $null: true };
    }

    const [data, total] = await Promise.all([
      strapi.entityService.findMany('api::image.image', {
        filters,
        start: offset,
        limit,
        sort: { id: 'desc' },
        populate: ['series', 'episodes', 'migration_stats']
      }),
      strapi.entityService.count('api::image.image', { filters })
    ]);

    const stats = await this.getMigrationStats();

    return {
       data,
       meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit)
       },
       stats
     };
   },

  async uploadToCloudflare(imageUrl) {
    try {
      // Validar que la URL de la imagen sea válida
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      strapi.log.info(`Attempting to upload image to Cloudflare: ${imageUrl}`);

      const formData = new FormData();
      formData.append('url', imageUrl);

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      strapi.log.info('Cloudflare API response:', JSON.stringify(data, null, 2));

      if (data.success && data.result) {
        // Verificar que tenemos los datos necesarios
        if (!data.result.variants || data.result.variants.length === 0) {
          throw new Error('No variants returned from Cloudflare');
        }
        
        if (!data.result.id) {
          throw new Error('No ID returned from Cloudflare');
        }

        const result = {
          cf_path: data.result.variants[0]
        };

        strapi.log.info(`Successfully uploaded to Cloudflare. Path: ${result.cf_path}`);
        return result;
      } else {
        const errorMessage = data.errors?.[0]?.message || 'Unknown error from Cloudflare API';
        strapi.log.error('Cloudflare upload failed:', errorMessage);
        throw new Error(`Cloudflare upload failed: ${errorMessage}`);
      }
    } catch (error) {
      strapi.log.error('Error uploading to Cloudflare:', error.message);
      throw error;
    }
  },

  // Migrar una imagen individual
  async migrateImage(imageId) {
    try {
      const image = await strapi.entityService.findOne('api::image.image', imageId);
      
      if (!image || !image.path) {
        throw new Error('Image not found or has no path');
      }

      if (image.cf_path) {
        return { success: true, message: 'Image already migrated', cfPath: image.cf_path };
      }

      // Construir URL completa
      const fullUrl = `${process.env.STRAPI_CDN_ENDPOINT}${image.path}`;
      
      // Subir a Cloudflare
      const result = await this.uploadToCloudflare(fullUrl);
      
      // Actualizar imagen en base de datos
      await strapi.entityService.update('api::image.image', imageId, {
        data: {
          cf_path: result.cf_path
        }
      });

      // Crear o actualizar estadísticas de migración
      const existingStats = await strapi.entityService.findMany('api::image-migration-stat.image-migration-stat', {
        filters: { image: imageId }
      });

      if (existingStats.length > 0) {
        await strapi.entityService.update('api::image-migration-stat.image-migration-stat', existingStats[0].id, {
          data: {
            migration_status: 'completed',
            migrated_at: new Date()
          }
        });
      } else {
        await strapi.entityService.create('api::image-migration-stat.image-migration-stat', {
          data: {
            image: imageId,
            migration_status: 'completed',
            migrated_at: new Date()
          }
        });
      }

      return {
        success: true,
        cfPath: result.cf_path,
        message: 'Image migrated successfully'
      };
    } catch (error) {
      // Marcar como fallida en las estadísticas de migración
      const existingStats = await strapi.entityService.findMany('api::image-migration-stat.image-migration-stat', {
        filters: { image: imageId }
      });

      if (existingStats.length > 0) {
        await strapi.entityService.update('api::image-migration-stat.image-migration-stat', existingStats[0].id, {
          data: {
            migration_status: 'failed',
            migration_error: error.message,
            last_attempt_at: new Date(),
            retry_count: (existingStats[0].retry_count || 0) + 1
          }
        });
      } else {
        await strapi.entityService.create('api::image-migration-stat.image-migration-stat', {
          data: {
            image: imageId,
            migration_status: 'failed',
            migration_error: error.message,
            last_attempt_at: new Date(),
            retry_count: 1
          }
        });
      }
      
      throw error;
     }
   },

  // Iniciar proceso de migración
  async startMigrationProcess({ batchSize = 10, retryFailedOnly = false }) {
    if (this.migrationProcess.isRunning) {
      throw new Error('Migration process is already running');
    }

    const processId = `migration_${Date.now()}`;
    
    this.migrationProcess = {
      isRunning: true,
      isPaused: false,
      processId,
      startedAt: Date.now(),
      pausedAt: null,
      batchSize,
      currentBatch: 0,
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      retryFailedOnly
    };

    // Ejecutar migración en background
    this.runMigrationProcess();
    
    return processId;
  },

  // Pausar proceso de migración
  async pauseMigrationProcess() {
    if (!this.migrationProcess.isRunning) {
      throw new Error('No migration process is running');
    }
    
    this.migrationProcess.isPaused = true;
    this.migrationProcess.pausedAt = Date.now();
  },

  // Reanudar proceso de migración
  async resumeMigrationProcess() {
    if (!this.migrationProcess.isRunning) {
      throw new Error('No migration process is running');
    }
    
    if (!this.migrationProcess.isPaused) {
      throw new Error('Migration process is not paused');
    }
    
    this.migrationProcess.isPaused = false;
    this.migrationProcess.pausedAt = null;
    
    // Continuar con la migración
    this.runMigrationProcess();
  },

  // Ejecutar proceso de migración
  async runMigrationProcess() {
    try {
      while (this.migrationProcess.isRunning && !this.migrationProcess.isPaused) {
        // Obtener siguiente lote de imágenes
        let filters;
        if (this.migrationProcess.retryFailedOnly) {
          // Para reintentos, buscar imágenes con estadísticas de migración fallidas
          const failedStats = await strapi.entityService.findMany('api::image-migration-stat.image-migration-stat', {
            filters: { migration_status: 'failed' },
            populate: ['image']
          });
          const failedImageIds = failedStats.map(stat => stat.image.id);
          filters = { id: { $in: failedImageIds }, path: { $notNull: true } };
        } else {
          // Para migración normal, buscar imágenes sin cf_path y sin estadísticas fallidas
          filters = { cf_path: { $null: true }, path: { $notNull: true } };
        }
        
        const images = await strapi.entityService.findMany('api::image.image', {
          filters,
          start: this.migrationProcess.currentBatch * this.migrationProcess.batchSize,
          limit: this.migrationProcess.batchSize,
          sort: { id: 'asc' }
        });

        if (images.length === 0) {
          // No hay más imágenes para procesar
          this.migrationProcess.isRunning = false;
          strapi.log.info('Migration process completed');
          break;
        }

        // Procesar cada imagen en el lote
        for (const image of images) {
          if (!this.migrationProcess.isRunning || this.migrationProcess.isPaused) {
            break;
          }

          try {
            await this.migrateImage(image.id);
            this.migrationProcess.successCount++;
            strapi.log.info(`Image ${image.id} migrated successfully`);
          } catch (error) {
            this.migrationProcess.errorCount++;
            strapi.log.error(`Failed to migrate image ${image.id}:`, error.message);
          }

          this.migrationProcess.totalProcessed++;
          
          // Rate limiting: esperar 500ms entre requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        this.migrationProcess.currentBatch++;
        
        // Pequeña pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      strapi.log.error('Migration process error:', error);
      this.migrationProcess.isRunning = false;
    }
  },

  // Reintentar migración de imagen específica
  async retryImageMigration(imageId) {
    try {
      const result = await this.migrateImage(imageId);
      return result;
    } catch (error) {
      throw new Error(`Failed to retry migration for image ${imageId}: ${error.message}`);
    }
  },

  // Crear imagen con subida automática a Cloudflare (siempre mantiene local como fallback)
  async createImageWithCloudflare(imageData) {
    try {
      // Primero crear la imagen en la base de datos (esto ya la guarda localmente)
      const createdImage = await strapi.entityService.create('api::image.image', {
        data: {
          ...imageData,
          publishedAt: Date.now()
        }
      });
      const image = await strapi.entityService.findOne('api::image.image', createdImage.id);
      // La imagen ya está guardada localmente, ahora intentar subirla también a Cloudflare
      if (image.path) {
        try {
          const fullUrl = `${process.env.STRAPI_CDN_ENDPOINT}${image.path}`;
          console.log(fullUrl)
          const cloudflareResult = await this.uploadToCloudflare(fullUrl);
          
          // Actualizar la imagen con los datos de Cloudflare (manteniendo el path local)
          const updatedImage = await strapi.entityService.update('api::image.image', image.id, {
            data: {
              cf_path: cloudflareResult.cf_path
            }
          });
          
          strapi.log.info(`Image ${image.id} uploaded successfully to both local and Cloudflare`);
          return { ...updatedImage, cloudflare_uploaded: true };
        } catch (cloudflareError) {
          strapi.log.warn(`Image ${image.id} saved locally but failed to upload to Cloudflare: ${cloudflareError.message}`);
          return { ...image, cloudflare_uploaded: false, cloudflare_error: cloudflareError.message };
        }
      }
      
      return { ...image, cloudflare_uploaded: false };
    } catch (error) {
      throw new Error(`Failed to create image: ${error.message}`);
    }
  },

  // Actualizar imagen con subida automática a Cloudflare (siempre mantiene local como fallback)
  async updateImageWithCloudflare(imageId, imageData) {
    try {
      // Primero actualizar la imagen en la base de datos (esto ya la guarda localmente)
      const updatedImage = await strapi.entityService.update('api::image.image', imageId, {
        data: imageData
      });
      
      const image = await strapi.entityService.findOne('api::image.image', imageId);
      
      // La imagen ya está actualizada localmente, ahora intentar subirla también a Cloudflare
      if (image.path) {
        try {
          // Construir la URL completa con la nueva imagen actualizada
          const fullUrl = `${process.env.STRAPI_CDN_ENDPOINT}${image.path}`;
          console.log('Uploading updated image to Cloudflare:', fullUrl);
          
          // Subir la nueva imagen a Cloudflare
          const cloudflareResult = await this.uploadToCloudflare(fullUrl);
          
          // Actualizar la imagen con los datos de Cloudflare (manteniendo el path local)
          const finalImage = await strapi.entityService.update('api::image.image', imageId, {
            data: {
              cf_path: cloudflareResult.cf_path
            }
          });

          // Crear o actualizar estadísticas de migración
          const existingStats = await strapi.entityService.findMany('api::image-migration-stat.image-migration-stat', {
            filters: { image: imageId }
          });

          if (existingStats.length > 0) {
            await strapi.entityService.update('api::image-migration-stat.image-migration-stat', existingStats[0].id, {
              data: {
                migration_status: 'completed',
                migrated_at: new Date()
              }
            });
          } else {
            await strapi.entityService.create('api::image-migration-stat.image-migration-stat', {
              data: {
                image: imageId,
                migration_status: 'completed',
                migrated_at: new Date()
              }
            });
          }
          
          strapi.log.info(`Image ${imageId} updated successfully to both local and Cloudflare`);
          return { ...finalImage, cloudflare_uploaded: true };
        } catch (cloudflareError) {
          // Marcar como fallida en las estadísticas de migración
          const existingStats = await strapi.entityService.findMany('api::image-migration-stat.image-migration-stat', {
            filters: { image: imageId }
          });

          if (existingStats.length > 0) {
            await strapi.entityService.update('api::image-migration-stat.image-migration-stat', existingStats[0].id, {
              data: {
                migration_status: 'failed',
                migration_error: cloudflareError.message,
                last_attempt_at: new Date(),
                retry_count: (existingStats[0].retry_count || 0) + 1
              }
            });
          } else {
            await strapi.entityService.create('api::image-migration-stat.image-migration-stat', {
              data: {
                image: imageId,
                migration_status: 'failed',
                migration_error: cloudflareError.message,
                last_attempt_at: new Date(),
                retry_count: 1
              }
            });
          }
          
          strapi.log.warn(`Image ${imageId} updated locally but failed to upload to Cloudflare: ${cloudflareError.message}`);
          return { ...image, cloudflare_uploaded: false, cloudflare_error: cloudflareError.message };
        }
      }
      
      return { ...image, cloudflare_uploaded: false };
    } catch (error) {
      throw new Error(`Failed to update image: ${error.message}`);
    }
  }
}));
