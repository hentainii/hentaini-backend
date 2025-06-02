'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/comments/:id/reply',
      handler: 'custom-comment.createReply',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/comments/:id/replies',
      handler: 'custom-comment.getReplies',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/comments/:id/like',
      handler: 'custom-comment.toggleLike',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/comments/:id/stats',
      handler: 'custom-comment.getCommentStats',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};