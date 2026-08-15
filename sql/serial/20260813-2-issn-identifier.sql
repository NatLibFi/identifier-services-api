-- ISSN identifier v2.0.0-alpha.1
CREATE TABLE issn_identifier (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  issn_range_id INT UNSIGNED,
  serial_publication_id INT UNSIGNED, -- i.e., if not null, ISSN is used
  identifier VARCHAR(9) NOT NULL,
  frozen BOOLEAN NOT NULL, -- i.e., cancelled and should not be reassigned
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;