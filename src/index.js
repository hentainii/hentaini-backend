'use strict';

module.exports = async ({ strapi }) => {
  // Grant public permissions for notification find/findOne (for testing)
  // Or authenticated permissions.
  // Assuming 'authenticated' role exists.
  
  try {
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });
    
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    const permissions = [
      'api::notification.notification.find',
      'api::notification.notification.findOne',
      'api::notification.notification.create', // Optional
      'api::notification.notification.update'  // For marking as read
    ];

    await Promise.all(permissions.map(async action => {
      // Add to Authenticated
      if (authenticatedRole) {
          const count = await strapi.query('plugin::users-permissions.permission').count({
            where: {
                role: authenticatedRole.id,
                action: action
            }
          });
          if (count === 0) {
            await strapi.query('plugin::users-permissions.permission').create({
                data: {
                    role: authenticatedRole.id,
                    action: action,
                    enabled: true
                }
            });
            strapi.log.info(`Added permission ${action} to Authenticated role`);
          }
      }
    }));
    
  } catch (e) {
    strapi.log.error('Bootstrap permission error:', e);
  }
};
