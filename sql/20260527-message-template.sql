-- message template v2.0.0-alpha.1
CREATE TABLE message_template (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  message_type VARCHAR(50) NOT NULL,
  lang_code VARCHAR(5) NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  created DATETIME NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  modified DATETIME NOT NULL,
  modified_by VARCHAR(36) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_swedish_ci;