module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: "strapi::body",
    config: {
      formLimit: "2048mb", // modify form body
      jsonLimit: "2048mb", // modify JSON body
      textLimit: "2048mb", // modify text body
      formidable: {
        maxFileSize: 2048 * 1024 * 1024, // multipart data, modify here limit of uploaded file size
      },
    },
  },
  'strapi::favicon',
  'strapi::public',
];
