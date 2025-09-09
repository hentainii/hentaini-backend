module.exports = {
  routes: [
    {
     method: 'GET',
     path: '/landing-data',
     handler: 'landing-data.getLandingData',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
