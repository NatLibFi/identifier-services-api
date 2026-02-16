-- ISBN range v2.0.0-alpha.2
CREATE TABLE isbn_range (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  gs1 VARCHAR(3) NOT NULL,
  registration_group VARCHAR(3) NOT NULL,
  range_begin VARCHAR(7) NOT NULL,
  range_end VARCHAR(7) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT 1,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;