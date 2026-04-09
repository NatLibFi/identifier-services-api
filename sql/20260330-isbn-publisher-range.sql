-- ISBN publisher range v2.0.0-alpha.3
CREATE TABLE isbn_publisher_range (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  publisher_identifier VARCHAR(15) NOT NULL,
  monograph_publisher_id INT UNSIGNED NOT NULL,
  isbn_range_id INT UNSIGNED NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (publisher_identifier),
  FOREIGN KEY (monograph_publisher_id) REFERENCES monograph_publisher(id),
  FOREIGN KEY (isbn_range_id) REFERENCES isbn_range(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;