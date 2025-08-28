import { getSequelize } from './index.js';
import { Task } from '../models/Task.js';
async function seed() {
    const sequelize = getSequelize();
    try {
        console.log('Creating database tables...');
        // Create all tables with raw SQL to ensure proper order and foreign keys
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`name\` VARCHAR(255) NOT NULL,
        \`google_id\` VARCHAR(255) UNIQUE,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`SocialAccountTokens\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`accountId\` VARCHAR(255) NOT NULL UNIQUE,
        \`accessToken\` TEXT NOT NULL,
        \`expiresAt\` DATETIME NULL,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`Files\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`originalName\` VARCHAR(255) NOT NULL,
        \`type\` VARCHAR(255) NOT NULL,
        \`size\` INTEGER NOT NULL,
        \`s3Key\` VARCHAR(255) NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`tags\` TEXT NULL,
        \`uploadedAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        \`captionUrl\` VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`ScheduledPosts\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`socialAccountTokenId\` INTEGER NOT NULL,
        \`text\` TEXT NOT NULL,
        \`media\` JSON NULL,
        \`scheduledFor\` DATETIME NOT NULL,
        \`status\` VARCHAR(255) NOT NULL DEFAULT 'pending',
        \`errorMessage\` TEXT NULL,
        \`publishedPostId\` VARCHAR(255) NULL,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`socialAccountTokenId\`) REFERENCES \`SocialAccountTokens\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`tasks\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`priority\` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        \`task_type\` ENUM('creative', 'admin') NOT NULL,
        \`status\` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
        \`deadline\` DATETIME NOT NULL,
        \`estimated_hours\` INTEGER,
        \`user_id\` INTEGER UNSIGNED NOT NULL,
        \`created_at\` DATETIME NOT NULL,
        \`updated_at\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('Tables created successfully!');
        // Insert initial data
        console.log('Inserting initial data...');
        // Insert test user
        await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (1, 'admin@example.com', 'Admin User', 'test-google-id', NOW(), NOW());
    `);
        // Create a welcome task using Sequelize model
        await Task.create({
            title: 'Welcome Task',
            description: 'This is your first seeded task!',
            priority: 'medium',
            task_type: 'admin',
            status: 'pending',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            estimated_hours: 2,
            user_id: 1,
            created_at: new Date(),
            updated_at: new Date(),
        });
        console.log('Seeding complete!');
        process.exit(0);
    }
    catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}
seed();
