ALTER TABLE `quartos` ADD `status` enum('pendente','concluido') DEFAULT 'pendente' NOT NULL;--> statement-breakpoint
ALTER TABLE `quartos` ADD `revisor` varchar(255);