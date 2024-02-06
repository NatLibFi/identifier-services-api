
/**
 * Used for interfacing Sequelize ORM model to the original ISSN publication/publicationArchiveEntry model
 * after patching issue where model reserved attribute had conflict with column name
 * @param {Object} publication Publication read from database
 * @returns {Object} publication that has no previousEntity-attribute but instead has previous-attribute
 */
export function transformIssnPublicationFromDb(publication) {
  const publicationWithPrevious = {...publication, previous: publication.previousEntity};
  delete publicationWithPrevious.previousEntity; // eslint-disable-line functional/immutable-data
  return publicationWithPrevious;
}


/**
 * Used for interfacing Sequelize ORM model to the original ISSN publication/publicationArchiveEntry model
 * after patching issue where model reserved attribute had conflict with column name.
 *
 * Utilized in automated tests where creation does not happen through API interface create function
 *
 * @param {Object} publication Publication read from database
 * @returns {Object} publication that has no previousEntity-attribute but instead has previous-attribute
 */
export function transformIssnPublicationToDb(publication) {
  const publicationWithPreviousEntity = {...publication, previousEntity: publication.previous};
  delete publicationWithPreviousEntity.previous; // eslint-disable-line functional/immutable-data
  return publicationWithPreviousEntity;
}
