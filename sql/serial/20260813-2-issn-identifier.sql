-- ISSN identifier v2.0.0-alpha.4
CREATE TABLE issn_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  issn_range_id INT UNSIGNED,
  serial_publication_id INT UNSIGNED, -- i.e., if not null, ISSN is used
  identifier VARCHAR(9) NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE (identifier),
  FOREIGN KEY (issn_range_id) REFERENCES issn_range(id),
  FOREIGN KEY (serial_publication_id) REFERENCES serial_publication(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;