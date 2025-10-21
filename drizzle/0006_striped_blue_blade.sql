ALTER TABLE `quartos` ADD `arquivoTaquigrafia` text;--> statement-breakpoint
ALTER TABLE `quartos` ADD `arquivoTaquigrafiaName` varchar(255);--> statement-breakpoint
ALTER TABLE `quartos` ADD `arquivoRedacaoFinal` text;--> statement-breakpoint
ALTER TABLE `quartos` ADD `arquivoRedacaoFinalName` varchar(255);--> statement-breakpoint
ALTER TABLE `quartos` ADD `comparacaoRealizada` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `quartos` ADD `taxaPrecisao` varchar(10);--> statement-breakpoint
ALTER TABLE `quartos` ADD `totalAlteracoes` int DEFAULT 0;