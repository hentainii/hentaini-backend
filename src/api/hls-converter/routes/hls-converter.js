'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/hls-converter/convert',
      handler: 'hls-converter.convertToHLS',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/hls-converter/status/:jobId',
      handler: 'hls-converter.getConversionStatus',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};