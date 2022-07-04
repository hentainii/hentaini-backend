module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '2dfc9f2d1e0a9cc7feefb5813b4bcde4'),
  },
});
