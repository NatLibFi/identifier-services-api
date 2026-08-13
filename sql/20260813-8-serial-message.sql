-- serial message v2.0.0-alpha.1
CREATE TABLE serial_message (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  serial_publisher_id INT UNSIGNED NOT NULL,
  serial_publication_request_id INT UNSIGNED,
  message_type VARCHAR(50) NOT NULL,
  lang_code VARCHAR(5) NOT NULL,
  recipient VARCHAR(100) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  `sent` DATETIME NOT NULL,
  sent_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (serial_publisher_id) REFERENCES serial_publisher(id),
  FOREIGN KEY (serial_publication_request_id) REFERENCES serial_publication_request(id),
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;