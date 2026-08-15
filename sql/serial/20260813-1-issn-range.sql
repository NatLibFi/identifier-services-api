-- ISSN range v2.0.0-alpha.1
CREATE TABLE issn_range (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `block` VARCHAR(4) NOT NULL,
  range_begin VARCHAR(4) NOT NULL,
  range_end VARCHAR(4) NOT NULL,
  active BOOLEAN NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;