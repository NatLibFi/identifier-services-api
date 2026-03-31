-- ISBN identifier v2.0.0-alpha.2
CREATE TABLE isbn_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier VARCHAR(20) NOT NULL,
  isbn_publisher_range_id INT UNSIGNED NOT NULL,
  monograph_manifestation_id INT UNSIGNED,
  canceled BOOLEAN NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (identifier),
  FOREIGN KEY (isbn_publisher_range_id) REFERENCES isbn_publisher_range(id)
  -- FOREIGN KEY (monograph_manifestation_id) REFERENCES monograph_manifestation(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;