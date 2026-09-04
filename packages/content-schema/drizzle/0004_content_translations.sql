CREATE TABLE `subject_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subject_translations_subject_id_locale_unique` ON `subject_translations` (`subject_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `topic_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topic_translations_topic_id_locale_unique` ON `topic_translations` (`topic_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `section_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `section_translations_section_id_locale_unique` ON `section_translations` (`section_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `tag_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_id` integer NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_translations_tag_id_locale_unique` ON `tag_translations` (`tag_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `lesson_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lesson_id` integer NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`body_mdx` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_translations_lesson_id_locale_unique` ON `lesson_translations` (`lesson_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `question_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`locale` text NOT NULL,
	`prompt_mdx` text NOT NULL,
	`resolution_mdx` text NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_translations_question_id_locale_unique` ON `question_translations` (`question_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `question_option_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`option_id` integer NOT NULL,
	`locale` text NOT NULL,
	`text_mdx` text NOT NULL,
	FOREIGN KEY (`option_id`) REFERENCES `question_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_option_translations_option_id_locale_unique` ON `question_option_translations` (`option_id`,`locale`);
--> statement-breakpoint
CREATE TABLE `question_matching_pair_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pair_id` integer NOT NULL,
	`locale` text NOT NULL,
	`left_mdx` text NOT NULL,
	`right_mdx` text NOT NULL,
	FOREIGN KEY (`pair_id`) REFERENCES `question_matching_pairs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_matching_pair_translations_pair_id_locale_unique` ON `question_matching_pair_translations` (`pair_id`,`locale`);
--> statement-breakpoint
ALTER TABLE `question_accepted_answers` ADD `locale` text;
--> statement-breakpoint
INSERT INTO `subject_translations` (`subject_id`, `locale`, `name`) SELECT `id`, 'pt-BR', `name` FROM `subjects`;
--> statement-breakpoint
INSERT INTO `topic_translations` (`topic_id`, `locale`, `name`) SELECT `id`, 'pt-BR', `name` FROM `topics`;
--> statement-breakpoint
INSERT INTO `section_translations` (`section_id`, `locale`, `name`) SELECT `id`, 'pt-BR', `name` FROM `sections`;
--> statement-breakpoint
INSERT INTO `tag_translations` (`tag_id`, `locale`, `name`) SELECT `id`, 'pt-BR', `name` FROM `tags`;
--> statement-breakpoint
INSERT INTO `lesson_translations` (`lesson_id`, `locale`, `title`, `body_mdx`) SELECT `id`, 'pt-BR', `title`, `body_mdx` FROM `lessons`;
--> statement-breakpoint
INSERT INTO `question_translations` (`question_id`, `locale`, `prompt_mdx`, `resolution_mdx`) SELECT `id`, 'pt-BR', `prompt_mdx`, `resolution_mdx` FROM `questions`;
--> statement-breakpoint
INSERT INTO `question_option_translations` (`option_id`, `locale`, `text_mdx`) SELECT `id`, 'pt-BR', `text_mdx` FROM `question_options`;
--> statement-breakpoint
INSERT INTO `question_matching_pair_translations` (`pair_id`, `locale`, `left_mdx`, `right_mdx`) SELECT `id`, 'pt-BR', `left_mdx`, `right_mdx` FROM `question_matching_pairs`;
--> statement-breakpoint
ALTER TABLE `subjects` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `topics` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `sections` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `tags` DROP COLUMN `name`;
--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `title`;
--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `body_mdx`;
--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `prompt_mdx`;
--> statement-breakpoint
ALTER TABLE `questions` DROP COLUMN `resolution_mdx`;
--> statement-breakpoint
ALTER TABLE `question_options` DROP COLUMN `text_mdx`;
--> statement-breakpoint
ALTER TABLE `question_matching_pairs` DROP COLUMN `left_mdx`;
--> statement-breakpoint
ALTER TABLE `question_matching_pairs` DROP COLUMN `right_mdx`;
