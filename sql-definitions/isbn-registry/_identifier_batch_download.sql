--Remember to add prefix manually!
CREATE TABLE IF NOT EXISTS `_isbn_registry_identifier_batch_download` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `sha256sum` VARCHAR(64) NOT NULL,
  `batch_id` INTEGER NOT NULL,
  `created` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_batch_id` (`batch_id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb3
COLLATE utf8mb3_swedish_ci;