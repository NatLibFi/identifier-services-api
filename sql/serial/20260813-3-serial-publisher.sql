-- serial publisher v2.0.0-alpha.1
CREATE TABLE serial_publisher (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  official_name VARCHAR(100) NOT NULL,
  contact_persons JSON NOT NULL,
  email_common VARCHAR(100),
  phone VARCHAR(30),
  `address` VARCHAR(50),
  zip VARCHAR(10),
  city VARCHAR(50),
  lang_code VARCHAR(5),
  additional_info VARCHAR(2000),
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;