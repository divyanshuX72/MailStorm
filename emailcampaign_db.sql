-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 19, 2026 at 08:47 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `emailcampaign_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` varchar(191) NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity` varchar(50) NOT NULL,
  `entityId` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` varchar(500) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `action`, `entity`, `entityId`, `details`, `ipAddress`, `userAgent`, `userId`, `createdAt`) VALUES
('b396a22e-9dc7-41c4-ba94-10bda32f551d', 'LOGIN', 'User', '904ed7ec-e870-4b0b-bbbc-d5c014a5228f', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', '904ed7ec-e870-4b0b-bbbc-d5c014a5228f', '2026-10-19 06:37:56.970');

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `originalName` varchar(255) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `path` varchar(500) NOT NULL,
  `campaignId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` varchar(191) NOT NULL,
  `name` varchar(200) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `status` enum('DRAFT','SCHEDULED','RUNNING','PAUSED','COMPLETED','CANCELLED','FAILED') NOT NULL DEFAULT 'DRAFT',
  `scheduledAt` datetime(3) DEFAULT NULL,
  `startedAt` datetime(3) DEFAULT NULL,
  `completedAt` datetime(3) DEFAULT NULL,
  `totalRecipients` int(11) NOT NULL DEFAULT 0,
  `sent` int(11) NOT NULL DEFAULT 0,
  `failed` int(11) NOT NULL DEFAULT 0,
  `opened` int(11) NOT NULL DEFAULT 0,
  `clicked` int(11) NOT NULL DEFAULT 0,
  `bounced` int(11) NOT NULL DEFAULT 0,
  `batchSize` int(11) NOT NULL DEFAULT 50,
  `delayMs` int(11) NOT NULL DEFAULT 1000,
  `retryAttempts` int(11) NOT NULL DEFAULT 3,
  `contactGroup` varchar(100) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `smtpAccountId` varchar(191) NOT NULL,
  `templateId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaign_recipients`
--

CREATE TABLE `campaign_recipients` (
  `id` varchar(191) NOT NULL,
  `status` enum('PENDING','QUEUED','SENDING','SENT','FAILED','BOUNCED') NOT NULL DEFAULT 'PENDING',
  `sentAt` datetime(3) DEFAULT NULL,
  `error` text DEFAULT NULL,
  `retryCount` int(11) NOT NULL DEFAULT 0,
  `campaignId` varchar(191) NOT NULL,
  `contactId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` varchar(191) NOT NULL,
  `email` varchar(255) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `groupName` varchar(100) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','BOUNCED','UNSUBSCRIBED') NOT NULL DEFAULT 'ACTIVE',
  `isSubscribed` tinyint(1) NOT NULL DEFAULT 1,
  `metadata` text DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('INFO','SUCCESS','WARNING','ERROR') NOT NULL DEFAULT 'INFO',
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `link` varchar(500) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'string',
  `label` varchar(200) DEFAULT NULL,
  `group` varchar(50) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `type`, `label`, `group`, `createdAt`, `updatedAt`) VALUES
('3b76cae4-2680-4316-9af4-018cf147069b', 'default_batch_size', '50', 'number', 'Default Batch Size', 'email', '2026-10-19 06:23:45.140', '2026-10-19 06:23:45.140'),
('4c36aa24-5ad5-45ce-b5e2-76a1e6bc01e2', 'maintenance_mode', 'false', 'boolean', 'Maintenance Mode', 'general', '2026-10-19 06:23:45.148', '2026-10-19 06:23:45.148'),
('65e4b310-f75f-451f-9735-55d88ad4673a', 'max_retry_attempts', '3', 'number', 'Max Retry Attempts', 'email', '2026-10-19 06:23:45.146', '2026-10-19 06:23:45.146'),
('96320aad-fc69-4179-88fe-7c113b95a518', 'allow_registration', 'true', 'boolean', 'Allow Registration', 'security', '2026-10-19 06:23:45.150', '2026-10-19 06:23:45.150'),
('d7cfd52a-0f68-44d6-9aaa-ef09f7516baf', 'default_delay_ms', '1000', 'number', 'Default Delay (ms)', 'email', '2026-10-19 06:23:45.143', '2026-10-19 06:23:45.143'),
('e0fe92e0-8fd5-4d14-9058-63ab1acb5444', 'app_name', 'Email Campaign Manager', 'string', 'Application Name', 'general', '2026-10-19 06:23:45.136', '2026-10-19 06:23:45.136');

-- --------------------------------------------------------

--
-- Table structure for table `smtp_accounts`
--

CREATE TABLE `smtp_accounts` (
  `id` varchar(191) NOT NULL,
  `name` varchar(100) NOT NULL,
  `host` varchar(255) NOT NULL,
  `port` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `encryptedPassword` text NOT NULL,
  `encryption` enum('SSL','TLS','NONE') NOT NULL DEFAULT 'TLS',
  `fromEmail` varchar(255) NOT NULL,
  `fromName` varchar(100) NOT NULL,
  `provider` enum('GMAIL','OUTLOOK','ZOHO','OFFICE365','CUSTOM') NOT NULL DEFAULT 'CUSTOM',
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `maxPerHour` int(11) NOT NULL DEFAULT 100,
  `maxPerDay` int(11) NOT NULL DEFAULT 2000,
  `sentToday` int(11) NOT NULL DEFAULT 0,
  `sentThisHour` int(11) NOT NULL DEFAULT 0,
  `lastResetAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` varchar(191) NOT NULL,
  `name` varchar(200) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `htmlContent` longtext DEFAULT NULL,
  `textContent` longtext DEFAULT NULL,
  `type` enum('HTML','PLAIN') NOT NULL DEFAULT 'HTML',
  `variables` text DEFAULT NULL,
  `thumbnail` varchar(500) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `avatar` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `refreshToken` text DEFAULT NULL,
  `resetToken` varchar(255) DEFAULT NULL,
  `resetTokenExp` datetime(3) DEFAULT NULL,
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `avatar`, `phone`, `company`, `isActive`, `refreshToken`, `resetToken`, `resetTokenExp`, `lastLoginAt`, `createdAt`, `updatedAt`) VALUES
('904ed7ec-e870-4b0b-bbbc-d5c014a5228f', 'Admin User', 'admin@emailcampaign.com', '$2a$12$98YfSbX0fS54tdq7qtkk9eYwZajQ9SZjha5V1n/JsvCmlEVeuX5Pa', 'ADMIN', NULL, NULL, NULL, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MDRlZDdlYy1lODcwLTRiMGItYmJiYy1kNWMwMTRhNTIyOGYiLCJlbWFpbCI6ImFkbWluQGVtYWlsY2FtcGFpZ24uY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzkyMzkxODc2LCJleHAiOjE3OTI5OTY2NzZ9.OqfcZ9LSAWWYVfPeaACbx4eqX17yTcnSiXqPSf0iTPg', NULL, NULL, '2026-10-19 06:37:56.942', '2026-10-19 06:23:45.129', '2026-10-19 06:37:56.944');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_userId_idx` (`userId`),
  ADD KEY `activity_logs_entity_idx` (`entity`),
  ADD KEY `activity_logs_action_idx` (`action`),
  ADD KEY `activity_logs_createdAt_idx` (`createdAt`);

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attachments_campaignId_idx` (`campaignId`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `campaigns_userId_idx` (`userId`),
  ADD KEY `campaigns_status_idx` (`status`),
  ADD KEY `campaigns_smtpAccountId_idx` (`smtpAccountId`),
  ADD KEY `campaigns_templateId_idx` (`templateId`),
  ADD KEY `campaigns_scheduledAt_idx` (`scheduledAt`),
  ADD KEY `campaigns_createdAt_idx` (`createdAt`);

--
-- Indexes for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `campaign_recipients_campaignId_contactId_key` (`campaignId`,`contactId`),
  ADD KEY `campaign_recipients_campaignId_idx` (`campaignId`),
  ADD KEY `campaign_recipients_contactId_idx` (`contactId`),
  ADD KEY `campaign_recipients_status_idx` (`status`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contacts_email_userId_key` (`email`,`userId`),
  ADD KEY `contacts_userId_idx` (`userId`),
  ADD KEY `contacts_email_idx` (`email`),
  ADD KEY `contacts_groupName_idx` (`groupName`),
  ADD KEY `contacts_status_idx` (`status`),
  ADD KEY `contacts_isSubscribed_idx` (`isSubscribed`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_userId_idx` (`userId`),
  ADD KEY `notifications_isRead_idx` (`isRead`),
  ADD KEY `notifications_createdAt_idx` (`createdAt`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_key` (`key`),
  ADD KEY `settings_key_idx` (`key`),
  ADD KEY `settings_group_idx` (`group`);

--
-- Indexes for table `smtp_accounts`
--
ALTER TABLE `smtp_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `smtp_accounts_userId_idx` (`userId`),
  ADD KEY `smtp_accounts_isDefault_idx` (`isDefault`),
  ADD KEY `smtp_accounts_isEnabled_idx` (`isEnabled`),
  ADD KEY `smtp_accounts_provider_idx` (`provider`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `templates_userId_idx` (`userId`),
  ADD KEY `templates_type_idx` (`type`),
  ADD KEY `templates_isActive_idx` (`isActive`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD KEY `users_email_idx` (`email`),
  ADD KEY `users_role_idx` (`role`),
  ADD KEY `users_isActive_idx` (`isActive`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `attachments_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD CONSTRAINT `campaigns_smtpAccountId_fkey` FOREIGN KEY (`smtpAccountId`) REFERENCES `smtp_accounts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `campaigns_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `templates` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `campaigns_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `campaign_recipients`
--
ALTER TABLE `campaign_recipients`
  ADD CONSTRAINT `campaign_recipients_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `campaign_recipients_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `smtp_accounts`
--
ALTER TABLE `smtp_accounts`
  ADD CONSTRAINT `smtp_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `templates`
--
ALTER TABLE `templates`
  ADD CONSTRAINT `templates_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
