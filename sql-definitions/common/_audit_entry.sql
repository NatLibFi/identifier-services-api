--Remember to add prefix manually!
CREATE TABLE IF NOT EXISTS `_common_audit_entry` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(64) NOT NULL,
  `operation` VARCHAR(64) NOT NULL,
  `primary_table` VARCHAR(64),
  `primary_table_primary_key` INT,
  `comment` VARCHAR(300),
  `created` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb3
COLLATE utf8mb3_swedish_ci;
