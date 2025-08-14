'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const hlsService = require('../services/hls-converter');

// Estado de trabajos de conversión
const conversionJobs = new Map();

// Cliente S3 para Cloudflare R2
let s3Client;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

function initializeR2Client(accessKeyId, secretAccessKey) {
  console.log(accessKeyId, secretAccessKey)
  if (!s3Client) {
    hlsService.validateR2Config();
    s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      signatureVersion: 'v4',
    });
  }
  return s3Client;
}

module.exports = {
  /**
   * Convertir video a HLS y subir a Cloudflare R2
   * POST /api/hls-converter/convert
   */
  async convertToHLS(ctx) {
    try {
      const { seriesSlug, episodeNumber } = ctx.request.body;
      const videoFile = ctx.request.files?.video;

      // Validar parámetros usando el servicio
      const validationErrors = hlsService.validateConversionParams(seriesSlug, episodeNumber, videoFile);
      if (validationErrors.length > 0) {
        return ctx.badRequest({
          data: {
            errors: validationErrors
          }
        });
      }

      // Generar ID único para el trabajo y código HLS
      const jobId = uuidv4();
      const hlsCode = hlsService.generateHLSCode(seriesSlug, episodeNumber);

      // Inicializar estado del trabajo
      conversionJobs.set(jobId, {
        status: 'iniciado',
        progress: 0,
        hlsCode,
        seriesSlug,
        episodeNumber,
        createdAt: new Date(),
        error: null,
        playlistUrl: null
      });

      // Procesar conversión de forma asíncrona
       this.currentJobId = jobId; // Para tracking de progreso
       this.processHLSConversion(jobId, videoFile, hlsCode).catch(error => {
         console.error('Error en conversión HLS:', error);
         this.updateStatus(jobId, 'error', 0, error.message);
       });

      // Responder inmediatamente con el ID del trabajo
      ctx.send({
        data: {
          jobId,
          hlsCode,
          status: 'iniciado',
          message: 'Conversión iniciada exitosamente'
        }
      });

    } catch (error) {
      console.error('Error iniciando conversión HLS:', error);
      ctx.internalServerError({
        data: {
          error: 'Error interno del servidor'
        }
      });
    }
  },

  /**
   * Obtener estado de conversión
   * GET /api/hls-converter/status/:jobId
   */
  async getConversionStatus(ctx) {
    try {
      const { jobId } = ctx.params;
      
      // Obtener el estado del Map conversionJobs
      const job = conversionJobs.get(jobId);
      
      if (!job) {
        return ctx.notFound('Trabajo no encontrado');
      }

      ctx.send({
        data: {
          jobId: jobId,
          status: job.status,
          progress: job.progress,
          message: job.message,
          playlistUrl: job.playlistUrl || null,
          error: job.error || null,
          hlsCode: job.hlsCode || null,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt || null
        }
      });
    } catch (error) {
      console.error('Error obteniendo estado de conversión:', error);
      ctx.badRequest('Error obteniendo estado de conversión');
    }
  },

  async processHLSConversion(jobId, videoFile, hlsCode) {
    let tempDir;
    
    try {
      // Limpiar carpeta temp/hls antes de iniciar conversión
      await this.cleanupTempHLSFolder();
      
      // Crear directorio temporal usando el servicio
      tempDir = hlsService.createTempDirectory(jobId);
      this.updateStatus(jobId, 'procesando', 5, 'Preparando archivos...');

      // Guardar archivo de video temporalmente
      const videoPath = path.join(tempDir, `input_${videoFile.name}`);
      
      // En Strapi 4, el archivo subido tiene la propiedad 'path' con la ruta temporal
      if (!videoFile.path) {
        throw new Error('No se encontró la ruta del archivo de video');
      }
      
      // Leer el archivo desde la ruta temporal y guardarlo en el directorio de trabajo
      const videoBuffer = fs.readFileSync(videoFile.path);
      fs.writeFileSync(videoPath, videoBuffer);

      this.updateStatus(jobId, 'procesando', 10, 'Analizando video...');

      // Obtener información del video
      const videoInfo = await hlsService.getVideoInfo(videoPath);
      const hlsSettings = hlsService.calculateHLSSettings(videoInfo);
      
      this.updateStatus(jobId, 'procesando', 15, 'Iniciando conversión HLS...');

      // Ejecutar FFmpeg para conversión HLS
      await this.runFFmpegConversion(jobId, videoPath, tempDir, hlsCode, hlsSettings, videoInfo);

      this.updateStatus(jobId, 'procesando', 60, 'Subiendo archivos a R2...');

      // Subir archivos HLS a Cloudflare R2
      const playlistUrl = await this.uploadHLSToR2(tempDir, hlsCode);

      // Actualizar estado final
      const job = conversionJobs.get(jobId);
      job.status = 'completado';
      job.progress = 100;
      job.playlistUrl = playlistUrl;
      job.completedAt = new Date();

      this.updateStatus(jobId, 'completado', 100, 'Conversión completada exitosamente');

    } catch (error) {
      console.error('Error en processHLSConversion:', error);
      this.updateStatus(jobId, 'error', 0, error.message);
      throw error;
    } finally {
      // Limpiar archivos temporales
      if (tempDir) {
        this.cleanupTempFiles(tempDir);
      }
    }
  },

  async runFFmpegConversion(jobId, videoPath, outputDir, hlsCode, hlsSettings, videoInfo) {
    return new Promise((resolve, reject) => {
      const { args, playlistPath } = hlsService.generateFFmpegArgs(videoPath, outputDir, hlsCode, hlsSettings);
      const duration = parseFloat(videoInfo.format.duration);

      const ffmpeg = spawn('ffmpeg', args);
      let errorOutput = '';
      
      // Almacenar referencia del proceso FFmpeg en el job para poder cancelarlo
      const job = conversionJobs.get(jobId);
      if (job) {
        job.ffmpegProcess = ffmpeg;
      }

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        
        // Parsear progreso usando el servicio
        const progress = hlsService.parseFFmpegProgress(output, duration);
        if (progress !== null) {
          this.updateStatus(jobId, 'procesando', 15 + progress, 'Convirtiendo a HLS...');
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          // Verificar que se creó el playlist
          if (fs.existsSync(playlistPath)) {
            resolve();
          } else {
            reject(new Error('No se generó el archivo playlist HLS'));
          }
        } else {
          reject(new Error(`FFmpeg falló con código ${code}: ${errorOutput}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Error ejecutando FFmpeg: ${error.message}`));
      });
    });
  },

  /**
   * Subir archivos HLS a Cloudflare R2
   */
  async uploadHLSToR2(tempDir, hlsCode) {
     try {
       const s3 = initializeR2Client(accessKeyId, secretAccessKey);
       const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
       const files = fs.readdirSync(tempDir).filter(file => file.endsWith('.ts') || file.endsWith('.m3u8'));
       
       let uploadedFiles = 0;
       const totalFiles = files.length;
       
       for (const file of files) {
         const filePath = path.join(tempDir, file);
         const fileContent = fs.readFileSync(filePath);
         
         const uploadParams = {
           Bucket: bucket,
           Key: `hls/${hlsCode}/${file}`,
           Body: fileContent,
           ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t'
         };

         await s3.send(new PutObjectCommand(uploadParams));
         uploadedFiles++;
         
         // Actualizar progreso de subida
         const uploadProgress = Math.round((uploadedFiles / totalFiles) * 35); // 35% del progreso total
         this.updateStatus(this.currentJobId, 'procesando', 60 + uploadProgress, `Subiendo archivo ${uploadedFiles}/${totalFiles}`);
       }

       return hlsService.generatePlaylistURL(hlsCode);

     } catch (error) {
       throw new Error(`Error subiendo a Cloudflare R2: ${error.message}`);
     }
   },

   /**
    * Limpiar archivos temporales
    */
   cleanupTempFiles(tempDir) {
      try {
        if (fs.existsSync(tempDir)) {
          const files = fs.readdirSync(tempDir);
          for (const file of files) {
            const filePath = path.join(tempDir, file);
            fs.unlinkSync(filePath);
          }
          fs.rmdirSync(tempDir);
        }
      } catch (error) {
        console.error('Error limpiando archivos temporales:', error);
      }
    },
 
   /**
    * Actualizar estado del trabajo
    */
   updateStatus(jobId, status, progress, message) {
     const job = conversionJobs.get(jobId);
     if (job) {
       job.status = status;
       job.progress = progress;
       job.message = message;
       job.updatedAt = new Date();
       
       if (status === 'error') {
         job.error = message;
       }
     }
   },

  /**
   * Limpiar carpeta temp/hls antes de cada conversión
   */
  async cleanupTempHLSFolder() {
    try {
      const tempHLSPath = path.join(process.cwd(), 'public', 'temp', 'hls');
      
      if (fs.existsSync(tempHLSPath)) {
        console.log('Limpiando carpeta temp/hls antes de nueva conversión...');
        
        // Leer contenido de la carpeta
        const files = fs.readdirSync(tempHLSPath);
        
        if (files.length > 0) {
          console.log(`Eliminando ${files.length} archivos/carpetas de temp/hls`);
          
          // Eliminar cada archivo/carpeta
          for (const file of files) {
            const filePath = path.join(tempHLSPath, file);
            fs.rmSync(filePath, { recursive: true, force: true });
          }
          
          console.log('Carpeta temp/hls limpiada exitosamente');
        } else {
          console.log('Carpeta temp/hls ya está vacía');
        }
      } else {
        console.log('Carpeta temp/hls no existe, creándola...');
        fs.mkdirSync(tempHLSPath, { recursive: true });
      }
    } catch (error) {
      console.error('Error limpiando carpeta temp/hls:', error);
      // No lanzar error para no interrumpir la conversión
    }
  },

  /**
   * Limpiar archivos temporales
   */
  cleanupTempFiles(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (error) {
      strapi.log.error('Error limpiando archivos temporales:', error);
    }
  },

  /**
   * Cancelar conversión HLS activa
   * POST /api/hls-converter/cancel/:jobId
   */
  async cancelConversion(ctx) {
    try {
      const { jobId } = ctx.params;
      
      // Buscar el trabajo en el Map
      const job = conversionJobs.get(jobId);
      
      if (!job) {
        return ctx.notFound({
          success: false,
          message: 'Trabajo no encontrado'
        });
      }
      
      // Verificar si el trabajo está en progreso
      if (job.status === 'completado' || job.status === 'error' || job.status === 'cancelado') {
        return ctx.badRequest({
          success: false,
          message: `No se puede cancelar un trabajo con estado: ${job.status}`
        });
      }
      
      // Terminar proceso FFmpeg si existe
      if (job.ffmpegProcess && !job.ffmpegProcess.killed) {
        console.log(`Terminando proceso FFmpeg para trabajo ${jobId}`);
        
        // Marcar trabajo como cancelado ANTES de terminar el proceso
        this.updateStatus(jobId, 'cancelado', 0, 'Conversión cancelada por el usuario');
        
        // Usar SIGKILL inmediatamente para terminación forzada
        job.ffmpegProcess.kill('SIGKILL');
        
        // Limpiar la referencia del proceso
        job.ffmpegProcess = null;
        
        console.log(`Proceso FFmpeg terminado con SIGKILL para trabajo ${jobId}`);
      }
      
      // Limpiar archivos temporales de la carpeta public/temp/hls
      await this.cleanupTempHLSFolder();
      
      console.log(`Trabajo HLS ${jobId} cancelado exitosamente`);
      
      ctx.send({
        success: true,
        message: 'Conversión cancelada exitosamente',
        jobId: jobId,
        status: 'cancelado'
      });
      
    } catch (error) {
      console.error('Error cancelando conversión HLS:', error);
      ctx.internalServerError({
        success: false,
        message: 'Error interno del servidor al cancelar la conversión',
        error: error.message
      });
    }
  }
};