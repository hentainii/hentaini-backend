'use strict';

async function up(knex) {
  const tableName = 'series'; // Asegúrate de usar el nombre correcto de tu tabla

  // 1. Agregar la nueva columna "url" a la tabla
  const hasUrlColumn = await knex.schema.hasColumn(tableName, 'url');
  if (!hasUrlColumn) {
    await knex.schema.table(tableName, (table) => {
      table.string('url').nullable();
    });
  }

  // 2. Generar valores de la columna "url" basados en "title"
  const rows = await knex(tableName).select('id', 'title');

  for (const row of rows) {
    const url = slugify(row.title);

    await knex(tableName)
      .where({ id: row.id })
      .update({ url });
  }
}

async function down(knex) {
  const tableName = 'series';

  // Eliminar la columna "url"
  const hasUrlColumn = await knex.schema.hasColumn(tableName, 'url');
  if (hasUrlColumn) {
    await knex.schema.table(tableName, (table) => {
      table.dropColumn('url');
    });
  }
}

/**
 * Helper para convertir un string en formato slug
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios por guiones
    .replace(/-+/g, '-'); // Evitar guiones consecutivos
}

module.exports = { up, down };
