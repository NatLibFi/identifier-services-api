-- Monograph publication v2.0.0-alpha.1
CREATE TABLE monograph_publication (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_publisher_id INT UNSIGNED,
  primary_title VARCHAR(200) NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_publisher_id) REFERENCES monograph_publisher(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;