-- monograph_message v2.0.0-alpha.3
CREATE TABLE monograph_message (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  monograph_publisher_id INT UNSIGNED,
  monograph_publication_request_id INT UNSIGNED,
  isbn_publisher_range_id INT UNSIGNED,
  ismn_publisher_range_id INT UNSIGNED,
  message_type VARCHAR(50) NOT NULL,
  lang_code VARCHAR(5) NOT NULL,
  recipient VARCHAR(100) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  `sent` DATETIME NOT NULL,
  sent_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (monograph_publisher_id) REFERENCES monograph_publisher(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;