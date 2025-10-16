ALTER TABLE `quartos` ADD `codigoQuarto` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `quartos` ADD `sessao` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `quartos` ADD `numeroQuarto` varchar(5) NOT NULL;--> statement-breakpoint
ALTER TABLE `quartos` DROP COLUMN `quantidade`;