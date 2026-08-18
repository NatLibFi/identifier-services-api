-- monograph identifier batch download v2.0.0-alpha.1
-- represents download action regarding identifier batch
CREATE TABLE monograph_identifier_batch_download (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_identifier_batch_id INT UNSIGNED NOT NULL,
  sha256sum VARCHAR(64) NOT NULL,
  created DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_identifier_batch_id) REFERENCES monograph_identifier_batch(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;