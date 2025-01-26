'use strict';

async function up(knex) {
  const seriesTable = 'series'; // Nombre de la tabla de series
  const genresTable = 'genres'; // Nombre de la tabla de géneros
  const seriesGenreLinksTable = 'series_genre_list_links'; // Nombre de la tabla de relaciones

  // 1. Obtener todas las series con la columna "genres"
  const series = await knex(seriesTable).select('id', 'genres');

  for (const serie of series) {
    // 2. Parsear el JSON de la columna "genres"
    const genres = JSON.parse(serie.genres);

    console.log(genres)

    for (const genreData of genres || []) {
      const { text, value, url } = genreData;
      let slug;
      if (!url) {
        slug = slugify(text);
      } else {
        slug = url;
      }
      // 3. Buscar o crear el género en la tabla "genres"
      console.log(url, slug)
      let genre = await knex(genresTable)
        .where({ "url": slug })
        .first();

      if (!genre) {
        // Si el género no existe, crearlo
        const [genreId] = await knex(genresTable)
          .insert({
            name: text.charAt(0).toUpperCase() + text.slice(1),
            url,
            created_at: new Date(),
            updated_at: new Date(),
            published_at: new Date(),
          })
          .returning('id');

        genre = { id: genreId };
      }

      // 4. Verificar si la relación ya existe en "series_genre_list_links"
      const existingRelation = await knex(seriesGenreLinksTable)
        .where({
          serie_id: serie.id,
          genre_id: genre.id,
        })
        .first();

      if (!existingRelation) {
        // 5. Insertar la relación en la tabla "series_genre_list_links" solo si no existe
        await knex(seriesGenreLinksTable).insert({
          serie_id: serie.id,
          genre_id: genre.id,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }
  }
}

async function down(knex) {
  const seriesGenreLinksTable = 'series_genre_list_links';

  // Eliminar todas las relaciones de la tabla "series_genre_list_links"
  await knex(seriesGenreLinksTable).truncate();
}

// hypenated name
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios por guiones
    .replace(/-+/g, '-'); // Evitar guiones consecutivos
}

module.exports = { up, down };