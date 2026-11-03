-- ISBN identifier v2.0.0-alpha.6
CREATE TABLE isbn_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier VARCHAR(20) NOT NULL,
  isbn_publisher_range_id INT UNSIGNED NOT NULL,
  monograph_publication_manifestation_id INT UNSIGNED,
  monograph_identifier_batch_id INT UNSIGNED,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (identifier),
  UNIQUE (monograph_publication_manifestation_id),
  FOREIGN KEY (isbn_publisher_range_id) REFERENCES isbn_publisher_range(id),
  FOREIGN KEY (monograph_publication_manifestation_id) REFERENCES monograph_publication_manifestation(id),
  FOREIGN KEY (monograph_identifier_batch_id) REFERENCES monograph_identifier_batch(id),
  INDEX idx_isbn_identifier_modified (modified) -- modification is either creation, assignation or revoking of identifier
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;