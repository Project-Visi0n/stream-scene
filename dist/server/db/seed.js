import { getSequelize } from './connection.js';
async function seed(forceRecreate = false) {
    const sequelize = getSequelize();
    try {
        console.log('🚀 Starting database seeding...');
        // Test database connection first
        await sequelize.authenticate();
        console.log('✅ Database connection established');
        if (forceRecreate) {
            console.log('⚠️  Force recreate enabled - dropping all tables...');
            await sequelize.sync({ force: true });
        }
        console.log('📦 Creating database tables in proper order...');
        // 1. Create users table first (referenced by many other tables)
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`name\` VARCHAR(255) NOT NULL,
        \`google_id\` VARCHAR(255) UNIQUE,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Users table created');
        // 2. Create SocialAccountTokens table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`SocialAccountTokens\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`accountId\` VARCHAR(255) NOT NULL UNIQUE,
        \`accessToken\` TEXT NOT NULL,
        \`expiresAt\` DATETIME NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
        console.log('✅ SocialAccountTokens table created');
        // 3. Create ScheduledPosts table
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
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`socialAccountTokenId\`) REFERENCES \`SocialAccountTokens\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ ScheduledPosts table created');
        // 4. Create Files table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`files\` (
        \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`originalName\` VARCHAR(255) NOT NULL,
        \`type\` VARCHAR(255) NOT NULL,
        \`size\` INTEGER NOT NULL,
        \`s3Key\` VARCHAR(255) NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`tags\` TEXT NULL,
        \`uploadedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`captionUrl\` VARCHAR(255) NULL,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Files table created');
        // 5. Create canvases table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`canvases\` (
        \`id\` VARCHAR(255) NOT NULL,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`width\` INTEGER NOT NULL DEFAULT 800,
        \`height\` INTEGER NOT NULL DEFAULT 600,
        \`backgroundColor\` VARCHAR(7) NOT NULL DEFAULT '#ffffff',
        \`isPublic\` TINYINT(1) NOT NULL DEFAULT false,
        \`allowAnonymousEdit\` TINYINT(1) NOT NULL DEFAULT false,
        \`canvasData\` LONGTEXT NOT NULL,
        \`shareToken\` VARCHAR(255) NULL UNIQUE,
        \`version\` INTEGER NOT NULL DEFAULT 1,
        \`maxCollaborators\` INTEGER NOT NULL DEFAULT 10,
        \`lastActivity\` DATETIME NULL,
        \`lastEditedBy\` INTEGER UNSIGNED NULL,
        \`lastEditedByGuest\` VARCHAR(255) NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`lastEditedBy\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Canvases table created');
        // 6. Create canvas_collaborators table (fixed foreign key types)
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`canvas_collaborators\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`canvasId\` VARCHAR(255) NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestIdentifier\` VARCHAR(255) NULL COMMENT 'Session/browser identifier for anonymous collaborators',
        \`guestName\` VARCHAR(100) NULL,
        \`permission\` ENUM('view', 'edit', 'admin') NOT NULL DEFAULT 'edit',
        \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
        \`joinedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When user joined as collaborator',
        \`lastSeenAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`canvasId\`) REFERENCES \`canvases\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Canvas collaborators table created');
        // 7. Create comments table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`comments\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`fileId\` INTEGER UNSIGNED NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestName\` VARCHAR(255) NULL,
        \`guestIdentifier\` VARCHAR(255) NULL,
        \`content\` TEXT NOT NULL,
        \`timestampSeconds\` INTEGER NULL,
        \`parentCommentId\` INTEGER NULL,
        \`isDeleted\` TINYINT(1) NOT NULL DEFAULT false,
        \`isModerationHidden\` TINYINT(1) NOT NULL DEFAULT false,
        \`isEdited\` TINYINT(1) NOT NULL DEFAULT false,
        \`isModerated\` TINYINT(1) NOT NULL DEFAULT false,
        \`moderatedReason\` VARCHAR(500) NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`fileId\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`parentCommentId\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Comments table created');
        // 8. Create comment_reactions table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`comment_reactions\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`commentId\` INTEGER NOT NULL,
        \`userId\` INTEGER UNSIGNED NULL,
        \`guestIdentifier\` VARCHAR(255) NULL,
        \`reactionType\` ENUM('like', 'dislike', 'love', 'laugh', 'wow', 'sad', 'angry') NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_user_reaction\` (\`commentId\`, \`userId\`),
        UNIQUE KEY \`unique_guest_reaction\` (\`commentId\`, \`guestIdentifier\`),
        FOREIGN KEY (\`commentId\`) REFERENCES \`comments\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Comment reactions table created');
        // 9. Create shares table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`shares\` (
        \`id\` INTEGER AUTO_INCREMENT,
        \`fileId\` INTEGER UNSIGNED NOT NULL,
        \`userId\` INTEGER UNSIGNED NOT NULL,
        \`shareToken\` VARCHAR(255) NOT NULL UNIQUE,
        \`expiresAt\` DATETIME NULL,
        \`allowComments\` TINYINT(1) NOT NULL DEFAULT true,
        \`allowDownload\` TINYINT(1) NOT NULL DEFAULT true,
        \`password\` VARCHAR(255) NULL,
        \`viewCount\` INTEGER NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`fileId\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Shares table created');
        // 10. Create tasks table
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
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
        console.log('✅ Tasks table created');
        console.log('🎉 All tables created successfully!');
        // Insert initial data
        console.log('🌱 Inserting initial seed data...');
        // Insert test user
        await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (1, 'admin@streamscene.net', 'StreamScene Admin', 'streamscene-admin-001', NOW(), NOW());
    `);
        console.log('✅ Admin user created');
        // Create a default canvas
        await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('project-center-main', 1, 'Project Center Main Canvas', 'Default canvas for project collaboration', '{"objects":[],"background":"#ffffff","version":"4.6.0"}', true, true);
    `);
        console.log('✅ Default canvas created');
        // Create a welcome task using direct SQL for consistency
        await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) 
      VALUES ('Welcome to StreamScene', 'Explore the collaborative features and get started with your first project!', 'medium', 'admin', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY), 2, 1);
    `);
        console.log('✅ Welcome task created');
        console.log('🎊 Database seeding completed successfully!');
        console.log('📊 Summary:');
        console.log('   - 10 tables created with proper foreign key relationships');
        console.log('   - Fixed userId foreign key type mismatch (INTEGER UNSIGNED)');
        console.log('   - Sample data inserted (admin user, default canvas, welcome task)');
        console.log('   - Database ready for production use');
    }
    catch (err) {
        console.error('❌ Seeding failed:', err);
        throw err;
    }
}
// Export for use as module
export { seed };
// If run directly, execute seeding
if (import.meta.url === `file://${process.argv[1]}`) {
    const forceRecreate = process.argv.includes('--force');
    if (forceRecreate) {
        console.log('⚠️  WARNING: --force flag detected. This will DROP ALL EXISTING DATA!');
        console.log('⏳ Waiting 3 seconds... Press Ctrl+C to cancel.');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    seed(forceRecreate)
        .then(() => {
        console.log('✅ Seed script completed successfully');
        process.exit(0);
    })
        .catch((err) => {
        console.error('❌ Seed script failed:', err);
        process.exit(1);
    });
}
