-- Monograph publication expression v2.0.0-alpha.1
CREATE TABLE monograph_publication_expression (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_publication_id INT UNSIGNED NOT NULL,
  expression_type VARCHAR(15) NOT NULL,
  expression_language VARCHAR(3) NOT NULL,
  authors JSON NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_publication_id) REFERENCES monograph_publication(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;