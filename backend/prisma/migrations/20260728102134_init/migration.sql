-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `avatar` VARCHAR(500) NULL,
    `phone` VARCHAR(20) NULL,
    `company` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `refreshToken` TEXT NULL,
    `resetToken` VARCHAR(255) NULL,
    `resetTokenExp` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smtp_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `host` VARCHAR(255) NOT NULL,
    `port` INTEGER NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `encryptedPassword` TEXT NOT NULL,
    `encryption` ENUM('SSL', 'TLS', 'NONE') NOT NULL DEFAULT 'TLS',
    `fromEmail` VARCHAR(255) NOT NULL,
    `fromName` VARCHAR(100) NOT NULL,
    `provider` ENUM('GMAIL', 'OUTLOOK', 'ZOHO', 'OFFICE365', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `maxPerHour` INTEGER NOT NULL DEFAULT 100,
    `maxPerDay` INTEGER NOT NULL DEFAULT 2000,
    `sentToday` INTEGER NOT NULL DEFAULT 0,
    `sentThisHour` INTEGER NOT NULL DEFAULT 0,
    `lastResetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `smtp_accounts_userId_idx`(`userId`),
    INDEX `smtp_accounts_isDefault_idx`(`isDefault`),
    INDEX `smtp_accounts_isEnabled_idx`(`isEnabled`),
    INDEX `smtp_accounts_provider_idx`(`provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NULL,
    `company` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `tags` TEXT NULL,
    `groupName` VARCHAR(100) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BOUNCED', 'UNSUBSCRIBED') NOT NULL DEFAULT 'ACTIVE',
    `isSubscribed` BOOLEAN NOT NULL DEFAULT true,
    `metadata` TEXT NULL,
    `source` VARCHAR(50) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `contacts_userId_idx`(`userId`),
    INDEX `contacts_email_idx`(`email`),
    INDEX `contacts_groupName_idx`(`groupName`),
    INDEX `contacts_status_idx`(`status`),
    INDEX `contacts_isSubscribed_idx`(`isSubscribed`),
    UNIQUE INDEX `contacts_email_userId_key`(`email`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `htmlContent` LONGTEXT NULL,
    `textContent` LONGTEXT NULL,
    `type` ENUM('HTML', 'PLAIN') NOT NULL DEFAULT 'HTML',
    `variables` TEXT NULL,
    `thumbnail` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `templates_userId_idx`(`userId`),
    INDEX `templates_type_idx`(`type`),
    INDEX `templates_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `totalRecipients` INTEGER NOT NULL DEFAULT 0,
    `sent` INTEGER NOT NULL DEFAULT 0,
    `failed` INTEGER NOT NULL DEFAULT 0,
    `opened` INTEGER NOT NULL DEFAULT 0,
    `clicked` INTEGER NOT NULL DEFAULT 0,
    `bounced` INTEGER NOT NULL DEFAULT 0,
    `batchSize` INTEGER NOT NULL DEFAULT 50,
    `delayMs` INTEGER NOT NULL DEFAULT 1000,
    `retryAttempts` INTEGER NOT NULL DEFAULT 3,
    `contactGroup` VARCHAR(100) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `smtpAccountId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaigns_userId_idx`(`userId`),
    INDEX `campaigns_status_idx`(`status`),
    INDEX `campaigns_smtpAccountId_idx`(`smtpAccountId`),
    INDEX `campaigns_templateId_idx`(`templateId`),
    INDEX `campaigns_scheduledAt_idx`(`scheduledAt`),
    INDEX `campaigns_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'BOUNCED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `error` TEXT NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `campaignId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campaign_recipients_campaignId_idx`(`campaignId`),
    INDEX `campaign_recipients_contactId_idx`(`contactId`),
    INDEX `campaign_recipients_status_idx`(`status`),
    UNIQUE INDEX `campaign_recipients_campaignId_contactId_key`(`campaignId`, `contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachments` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_campaignId_idx`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(100) NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_userId_idx`(`userId`),
    INDEX `activity_logs_entity_idx`(`entity`),
    INDEX `activity_logs_action_idx`(`action`),
    INDEX `activity_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'string',
    `label` VARCHAR(200) NULL,
    `group` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    INDEX `settings_key_idx`(`key`),
    INDEX `settings_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(500) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `smtp_accounts` ADD CONSTRAINT `smtp_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `templates_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_smtpAccountId_fkey` FOREIGN KEY (`smtpAccountId`) REFERENCES `smtp_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_recipients` ADD CONSTRAINT `campaign_recipients_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_recipients` ADD CONSTRAINT `campaign_recipients_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
