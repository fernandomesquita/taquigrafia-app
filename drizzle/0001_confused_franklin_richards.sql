CREATE TABLE `metasDiarias` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`data` varchar(10) NOT NULL,
	`metaQuartos` varchar(10) NOT NULL,
	`motivo` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `metasDiarias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quartos` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`quantidade` varchar(10) NOT NULL,
	`dataRegistro` timestamp NOT NULL DEFAULT (now()),
	`observacao` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `quartos_id` PRIMARY KEY(`id`)
);
