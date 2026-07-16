-- ISMN identifier v2.0.0-alpha.4
CREATE TABLE ismn_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier VARCHAR(20) NOT NULL,
  ismn_publisher_range_id INT UNSIGNED NOT NULL,
  monograph_publication_manifestation_id INT UNSIGNED,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (identifier),
  UNIQUE (monograph_publication_manifestation_id),
  FOREIGN KEY (ismn_publisher_range_id) REFERENCES ismn_publisher_range(id),
  FOREIGN KEY (monograph_publication_manifestation_id) REFERENCES monograph_publication_manifestation(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;