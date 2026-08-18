-- serial publication request archive v2.0.0-alpha.1
CREATE TABLE serial_publication_request_archive (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  serial_publication_request_id INT UNSIGNED NOT NULL,
  publisher_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(30),
  `address` VARCHAR(100),
  zip VARCHAR(10),
  city VARCHAR(50),
  lang_code VARCHAR(5) NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (serial_publication_request_id) REFERENCES serial_publication_request(id),
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;