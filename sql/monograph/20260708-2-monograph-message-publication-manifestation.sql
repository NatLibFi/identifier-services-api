-- monograph_message_publication_manifestation v2.0.0-alpha.2
CREATE TABLE monograph_message_publication_manifestation (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_message_id INT UNSIGNED,
  monograph_publication_manifestation_id INT UNSIGNED,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_message_id) REFERENCES monograph_message(id),
  FOREIGN KEY (monograph_publication_manifestation_id) REFERENCES monograph_publication_manifestation(id),
  UNIQUE(monograph_message_id, monograph_publication_manifestation_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;