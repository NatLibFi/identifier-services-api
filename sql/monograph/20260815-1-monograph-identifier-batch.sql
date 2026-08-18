-- monograph identifier batch v2.0.0-alpha.1
-- represents a set of monograph identifiers that is downloadable as text file
CREATE TABLE monograph_identifier_batch (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_publisher_id INT UNSIGNED NOT NULL,
  isbn_publisher_range_id INT UNSIGNED,
  ismn_publisher_range_id INT UNSIGNED,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (isbn_publisher_range_id) REFERENCES isbn_publisher_range(id),
  FOREIGN KEY (ismn_publisher_range_id) REFERENCES ismn_publisher_range(id),
  FOREIGN KEY (monograph_publisher_id) REFERENCES monograph_publisher(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;