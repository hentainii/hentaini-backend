'use strict';
const fs = require('fs')
/**
 * A set of functions called "actions" for `dxclient`
 */
module.exports = {
  async savesitemap(ctx) {
    const input = ctx.request.body
    console.log(input)
    fs.writeFileSync('sitemap.xml', input.sitemap)
    // const search = await strapi.service('api::client.client').find({
    //   filters: {
    //     code: input.dx.code,
    //     city: {
    //       name: {
    //         $eq: input.dxCity
    //       }
    //     }
    //   }, populate: ['city', 'city.mikrotiks']})
    // const searchCity = search.results[0].city
    // const clientObj = search.results[0]
    // const code = clientObj.code
    // if (search.length < 1) {
    //   process.push({ code: input.dx.code, name: 'NO ENCONTRADO', success: false })
    //   return process
    // }
    // const dni = clientObj.dni
    // const model = clientObj.newModel
    // const planDx = input.dxPlan.id
    // const planDxMk = input.dxPlan.name
    // const kick = input.dxKick
    // if (searchCity.mikrotiks.length > 1) {
    //   for (let i = 0; i < searchCity.mikrotiks.length; i++) {
    //     const cityIp = searchCity.mikrotiks[i].ip
    //     const res = await strapi.service('api::client.client').update(clientObj.id, { data: {plan: input.dxPlan.id }})
    //     const resMk = await mkDxClient({ dni, code, cityIp, model, planDxMk, kick })
    //     if (res && resMk) {
    //       process.push({ code: code, name: clientObj.name, success: true })
    //     } else {
    //       process.push({ code: code, name: clientObj.name, success: false })
    //     }
    //   }
    //   return process
    // } else {
    //   const cityIp = searchCity.mikrotiks[0].ip
    //   const res = await strapi.service('api::client.client').update(clientObj.id, { data: {plan: input.dxPlan.id }})
    //   const resMk = await mkDxClient({ dni, code, cityIp, model, planDxMk, kick })
    //   if (res && resMk) {
    //     process.push({ code: code, name: clientObj.name, success: true })
    //   } else {
    //     process.push({ code: code, name: clientObj.name, success: false })
    //   }
    //   return process
    // }
  },
};