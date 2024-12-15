module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '2dfc9f2d1e0a9cc7feefb5813b4bcde4'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'f0b0e0a9cc7feefb5813b4bcda4'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
});
