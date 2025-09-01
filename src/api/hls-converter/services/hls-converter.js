'use strict';

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

module.exports = {
  /**
   * Validar parámetros de conversión
   */
  validateConversionParams(seriesSlug, episodeNumber, videoFile) {
    const errors = [];

    if (!seriesSlug || typeof seriesSlug !== 'string' || seriesSlug.trim().length === 0) {
      errors.push('seriesSlug es requerido y debe ser una cadena válida');
    }

    if (!episodeNumber || isNaN(parseInt(episodeNumber))) {
      errors.push('episodeNumber es requerido y debe ser un número válido');
    }

    if (!videoFile) {
      errors.push('Archivo de video es requerido');
    } else {
      // Validar tipo de archivo
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
      if (!allowedTypes.includes(videoFile.type)) {
        errors.push('Tipo de archivo no soportado. Formatos permitidos: MP4, AVI, MOV, MKV');
      }

      // Validar tamaño (máximo 2GB)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB en bytes
      if (videoFile.size > maxSize) {
        errors.push('El archivo es demasiado grande. Tamaño máximo: 2GB');
      }
    }

    return errors;
  },

  /**
   * Generar código HLS único
   */
  generateHLSCode(seriesSlug, episodeNumber) {
    const cleanSlug = seriesSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const cleanEpisode = parseInt(episodeNumber);
    return `${cleanSlug}-${cleanEpisode}`;
  },

  /**
   * Crear directorio temporal para el trabajo
   */
  createTempDirectory(jobId) {
    const tempDir = path.join(process.cwd(), 'public/temp', 'hls', jobId);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    return tempDir;
  },

  /**
   * Obtener información del video usando FFprobe
   */
  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ]);

      let output = '';
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const info = JSON.parse(output);
            resolve(info);
          } catch (error) {
            reject(new Error('Error parseando información del video'));
          }
        } else {
          reject(new Error('Error obteniendo información del video'));
        }
      });
    });
  },

  /**
   * Calcular configuración óptima para HLS
   */
  calculateHLSSettings(videoInfo) {
    const videoStream = videoInfo.streams.find(s => s.codec_type === 'video');
    const audioStream = videoInfo.streams.find(s => s.codec_type === 'audio');
    
    if (!videoStream) {
      throw new Error('No se encontró stream de video');
    }

    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    const duration = parseFloat(videoInfo.format.duration);

    // Configuración basada en resolución
    let settings = {
      segmentTime: 20, // 20 segundos por segmento
      videoCodec: 'libx264',
      audioCodec: 'aac',
      preset: 'faster'
    };

    // Ajustar calidad fija
    settings.videoBitrate = '1400k';
    settings.audioBitrate = '96k';

    return settings;
  },

  /**
   * Generar argumentos de FFmpeg para conversión HLS
   */
  generateFFmpegArgs(inputPath, outputDir, hlsCode, settings) {
    const segmentPattern = path.join(outputDir, `${uuidv4()}_%03d.ts`);
    const playlistPath = path.join(outputDir, `${hlsCode}.m3u8`);

    return {
      args: [
        '-i', inputPath,
        '-c:v', settings.videoCodec,
        '-b:v', settings.videoBitrate,
        '-c:a', settings.audioCodec,
        '-b:a', settings.audioBitrate,
        '-preset', settings.preset,
        '-hls_time', settings.segmentTime.toString(),
        '-hls_list_size', '0',
        '-hls_segment_filename', segmentPattern,
        '-f', 'hls',
        playlistPath
      ],
      playlistPath,
      outputDir
    };
  },

  /**
   * Parsear progreso de FFmpeg desde stderr
   */
  parseFFmpegProgress(data, duration) {
    const timeMatch = data.match(/time=([\d:.]+)/);
    if (timeMatch && duration) {
      const timeStr = timeMatch[1];
      const timeParts = timeStr.split(':');
      const currentTime = parseInt(timeParts[0]) * 3600 + 
                         parseInt(timeParts[1]) * 60 + 
                         parseFloat(timeParts[2]);
      
      return Math.min(Math.round((currentTime / duration) * 50), 50); // 50% máximo para conversión
    }
    return null;
  },

  /**
   * Validar configuración de Cloudflare R2
   */
  validateR2Config() {
    const requiredEnvVars = [
      'CLOUDFLARE_R2_ENDPOINT',
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_BUCKET_NAME',
      'CLOUDFLARE_R2_DOMAIN_BASE_URL'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Variables de entorno faltantes para R2: ${missing.join(', ')}`);
    }
  },

  /**
   * Generar URL final del playlist
   */
  generatePlaylistURL(hlsCode) {
    const baseUrl = process.env.CLOUDFLARE_R2_DOMAIN_BASE_URL;
    return `${baseUrl}/hls/${hlsCode}/${hlsCode}.m3u8`;
  }
};