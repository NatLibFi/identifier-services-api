-- Monograph publication manifestation v2.0.0-alpha.1
CREATE TABLE monograph_publication_manifestation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_publication_expression_id INT UNSIGNED NOT NULL,
  monograph_publication_request_id INT UNSIGNED,
  manifestation_type VARCHAR(50) NOT NULL,
  manifestation_type_other VARCHAR(100),
  manifestation_edition VARCHAR(2),
  map_scale VARCHAR(50),
  authors JSON NOT NULL,
  publication_year VARCHAR(4),
  publication_month VARCHAR(2),
  series JSON NOT NULL,
  printing_information JSON NOT NULL,
  cancelled BOOLEAN NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_publication_expression_id) REFERENCES monograph_publication_expression(id),
  FOREIGN KEY (monograph_publication_request_id) REFERENCES monograph_publication_request(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;