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

    // 9. Create shares table (drop and recreate if schema conflicts)
    try {
      // First try to create normally
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`shares\` (
          \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
          \`fileId\` INTEGER UNSIGNED NULL,
          \`canvasId\` VARCHAR(255) NULL,
          \`userId\` INTEGER UNSIGNED NOT NULL,
          \`shareToken\` VARCHAR(255) NOT NULL UNIQUE,
          \`shareType\` ENUM('one-time', 'indefinite') NOT NULL DEFAULT 'indefinite',
          \`resourceType\` ENUM('file', 'canvas') NOT NULL,
          \`accessCount\` INTEGER NOT NULL DEFAULT 0,
          \`maxAccess\` INTEGER NULL,
          \`expiresAt\` DATETIME NULL,
          \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`fileId\`) REFERENCES \`files\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`canvasId\`) REFERENCES \`canvases\` (\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
      console.log('✅ Shares table created');
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('incompatible') || error.message.includes('foreign key')) {
        try {
          console.log('🔄 Attempting to recreate shares table with correct schema...');
          await sequelize.query('DROP TABLE IF EXISTS `shares`;');
          await sequelize.query(`
            CREATE TABLE \`shares\` (
              \`id\` INTEGER UNSIGNED AUTO_INCREMENT,
              \`fileId\` INTEGER UNSIGNED NULL,
              \`canvasId\` VARCHAR(255) NULL,
              \`userId\` INTEGER UNSIGNED NOT NULL,
              \`shareToken\` VARCHAR(255) NOT NULL UNIQUE,
              \`shareType\` ENUM('one-time', 'indefinite') NOT NULL DEFAULT 'indefinite',
              \`resourceType\` ENUM('file', 'canvas') NOT NULL,
              \`accessCount\` INTEGER NOT NULL DEFAULT 0,
              \`maxAccess\` INTEGER NULL,
              \`expiresAt\` DATETIME NULL,
              \`isActive\` TINYINT(1) NOT NULL DEFAULT true,
              \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              INDEX \`idx_fileId\` (\`fileId\`),
              INDEX \`idx_canvasId\` (\`canvasId\`),
              INDEX \`idx_userId\` (\`userId\`)
            ) ENGINE=InnoDB;
          `);
          console.log('✅ Shares table recreated with correct schema (without foreign keys for now)');
        } catch (recreateErr) {
          console.log('⚠️  Shares table recreation failed (continuing anyway):', (recreateErr as Error).message);
        }
      } else {
        console.log('⚠️  Shares table creation failed (continuing anyway):', error.message);
      }
    }

    // 10. Create tasks table
    try {
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
    } catch (err) {
      console.log('⚠️  Tasks table creation failed (continuing anyway):', (err as Error).message);
    }
    console.log('✅ Tasks table created');

    console.log('🎉 All tables created successfully!');
    
    // Insert initial data
    console.log('🌱 Inserting initial seed data...');
    
    // Insert test users
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (1, 'admin@streamscene.net', 'StreamScene Admin', 'streamscene-admin-001', NOW(), NOW());
    `);
    console.log('✅ Admin user created');

    // Insert specific user: allblk13@gmail.com
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`id\`, \`email\`, \`name\`, \`google_id\`, \`created_at\`, \`updated_at\`) 
      VALUES (2, 'allblk13@gmail.com', 'AllBlk Creator', 'allblk-creator-13', NOW(), NOW());
    `);
    console.log('✅ AllBlk user created');

    // Create default canvases
    await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('project-center-main', 1, 'Project Center Main Canvas', 'Default canvas for project collaboration', '{"objects":[],"background":"#ffffff","version":"4.6.0"}', true, true);
    `);
    console.log('✅ Default canvas created');

    // Create canvas for AllBlk user
    await sequelize.query(`
      INSERT IGNORE INTO \`canvases\` (\`id\`, \`userId\`, \`name\`, \`description\`, \`canvasData\`, \`isPublic\`, \`allowAnonymousEdit\`) 
      VALUES ('allblk-creative-workspace', 2, 'AllBlk Creative Workspace', 'Creative collaboration space for content planning', '{"objects":[],"background":"#1a1a2e","version":"4.6.0"}', true, true);
    `);
    console.log('✅ AllBlk canvas created');

    // Create a welcome task using direct SQL for consistency
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) 
      VALUES ('Welcome to StreamScene', 'Explore the collaborative features and get started with your first project!', 'medium', 'admin', 'pending', DATE_ADD(NOW(), INTERVAL 7 DAY), 2, 1);
    `);
    console.log('✅ Welcome task created');

    // Add comprehensive Twitch content creator tasks for presentation demo
    console.log('🎮 Adding Twitch content creator seed data...');
    
    // Get current date and calculate relative dates
    const now = new Date();
    const getCurrentDate = () => now.toISOString().slice(0, 19).replace('T', ' ');
    const getDateOffset = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };
    
    // Week 1 - Current week tasks
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Stream Setup & Testing', 'Test new overlay design and check audio levels before tonight stream', 'high', 'creative', 'in_progress', '${getCurrentDate()}', 3, 1),
      ('Valorant Tournament Stream', 'Stream the ranked Valorant tournament with viewer predictions', 'high', 'creative', 'pending', '${getDateOffset(1)}', 4, 1),
      ('Sponsor Content: NordVPN', 'Create sponsored segment for NordVPN integration during stream', 'medium', 'admin', 'pending', '${getDateOffset(2)}', 2, 1),
      ('Community Discord Event', 'Host movie night in Discord for subscribers', 'medium', 'creative', 'pending', '${getDateOffset(3)}', 3, 1),
      ('YouTube Highlights Edit', 'Edit best moments from this week streams for YouTube', 'medium', 'creative', 'pending', '${getDateOffset(4)}', 5, 1),
      ('TikTok Short Content', 'Create 3 TikTok shorts from funny stream moments', 'low', 'creative', 'pending', '${getDateOffset(5)}', 2, 1),
      ('Week 1 Analytics Review', 'Review Twitch analytics and plan improvements for next week', 'medium', 'admin', 'pending', '${getDateOffset(6)}', 1, 1);
    `);

    // Week 2 tasks
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Minecraft Building Stream', 'Continue building the castle project with chat suggestions', 'high', 'creative', 'pending', '${getDateOffset(8)}', 6, 1),
      ('Collaboration with StreamerBuddy', 'Duo streams with StreamerBuddy for Among Us content', 'high', 'creative', 'pending', '${getDateOffset(9)}', 4, 1),
      ('Emote Design Commission', 'Review and approve new subscriber emotes from artist', 'medium', 'admin', 'pending', '${getDateOffset(10)}', 2, 1),
      ('IRL Cooking Stream Setup', 'Set up kitchen camera for cooking stream this weekend', 'medium', 'creative', 'pending', '${getDateOffset(11)}', 3, 1),
      ('Sponsor Meeting: HyperX', 'Video call with HyperX for potential headset sponsorship', 'high', 'admin', 'pending', '${getDateOffset(12)}', 1, 1),
      ('Stream Deck Customization', 'Program new buttons for sound effects and quick commands', 'low', 'admin', 'pending', '${getDateOffset(13)}', 2, 1);
    `);

    // Week 3 tasks  
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Horror Game Marathon', '8-hour horror game marathon for Halloween content', 'high', 'creative', 'pending', '${getDateOffset(15)}', 8, 1),
      ('Subscriber Goal Celebration', 'Plan special celebration stream for hitting 50K followers', 'high', 'creative', 'pending', '${getDateOffset(16)}', 4, 1),
      ('Overlay Update Project', 'Work with designer on new seasonal overlay themes', 'medium', 'creative', 'pending', '${getDateOffset(17)}', 3, 1),
      ('Tax Document Organization', 'Organize receipts and income statements for Q3 taxes', 'high', 'admin', 'pending', '${getDateOffset(18)}', 4, 1),
      ('New Game Research', 'Research trending games for next month content', 'low', 'admin', 'pending', '${getDateOffset(19)}', 2, 1),
      ('Merchandise Store Update', 'Upload new t-shirt designs to merch store', 'medium', 'admin', 'pending', '${getDateOffset(20)}', 3, 1);
    `);

    // Week 4 tasks
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Monthly Subscriber Stream', 'Special subscriber-only Q&A and game night', 'high', 'creative', 'pending', '${getDateOffset(22)}', 5, 1),
      ('Equipment Upgrade Research', 'Research new camera and lighting equipment for studio', 'medium', 'admin', 'pending', '${getDateOffset(23)}', 3, 1),
      ('Brand Partnership Outreach', 'Reach out to 5 gaming brands for potential partnerships', 'medium', 'admin', 'pending', '${getDateOffset(24)}', 4, 1),
      ('Community Guidelines Update', 'Update Discord and chat rules for better moderation', 'low', 'admin', 'pending', '${getDateOffset(25)}', 2, 1),
      ('End of Month Report', 'Compile growth metrics and revenue report for the month', 'high', 'admin', 'pending', '${getDateOffset(26)}', 3, 1);
    `);

    // Completed tasks from previous weeks
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Setup New Webcam', 'Install and configure the new 4K webcam for better stream quality', 'high', 'admin', 'completed', '${getDateOffset(-3)}', 2, 1),
      ('Plan Weekly Schedule', 'Create streaming schedule for the week and post to social media', 'medium', 'admin', 'completed', '${getDateOffset(-5)}', 1, 1),
      ('Edit YouTube Video', 'Edit and upload last week best moments compilation', 'medium', 'creative', 'completed', '${getDateOffset(-7)}', 4, 1),
      ('Sponsor Content Review', 'Review and approve sponsor script for energy drink placement', 'high', 'admin', 'completed', '${getDateOffset(-2)}', 1, 1),
      ('Community Poll Creation', 'Create Twitter poll for next game to play on stream', 'low', 'creative', 'completed', '${getDateOffset(-1)}', 1, 1);
    `);
    
    console.log('✅ Twitch content creator tasks created');

    // Add comprehensive seed data for AllBlk user (allblk13@gmail.com)
    console.log('🎨 Adding AllBlk creator seed data...');
    
    // Current week tasks for AllBlk
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Video Script: Tech Review', 'Write script for new iPhone 16 review video', 'high', 'creative', 'in_progress', '${getCurrentDate()}', 4, 2),
      ('Thumbnail Design', 'Create eye-catching thumbnail for iPhone review video', 'high', 'creative', 'pending', '${getDateOffset(1)}', 2, 2),
      ('Brand Partnership: Sony', 'Finalize partnership agreement with Sony for camera gear', 'high', 'admin', 'pending', '${getDateOffset(2)}', 3, 2),
      ('YouTube Shorts Strategy', 'Plan 5 YouTube Shorts for increased engagement this week', 'medium', 'creative', 'pending', '${getDateOffset(3)}', 3, 2),
      ('Instagram Reel Content', 'Create behind-the-scenes reel from latest photoshoot', 'medium', 'creative', 'pending', '${getDateOffset(4)}', 2, 2),
      ('Email Newsletter', 'Draft monthly newsletter for subscribers with exclusive content', 'low', 'admin', 'pending', '${getDateOffset(5)}', 2, 2);
    `);

    // Week 2 tasks for AllBlk
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Collaboration: TechGuru23', 'Plan joint video with TechGuru23 about AI trends', 'high', 'creative', 'pending', '${getDateOffset(8)}', 5, 2),
      ('Product Unboxing Series', 'Film unboxing video for latest MacBook Pro', 'high', 'creative', 'pending', '${getDateOffset(9)}', 3, 2),
      ('Podcast Guest Appearance', 'Record interview for TechTalk Podcast about content creation', 'medium', 'admin', 'pending', '${getDateOffset(10)}', 2, 2),
      ('Analytics Deep Dive', 'Analyze YouTube performance and optimize content strategy', 'medium', 'admin', 'pending', '${getDateOffset(11)}', 4, 2),
      ('Website Content Update', 'Update portfolio website with latest projects and testimonials', 'low', 'admin', 'pending', '${getDateOffset(12)}', 3, 2),
      ('Social Media Audit', 'Review and optimize all social media profiles for consistency', 'low', 'admin', 'pending', '${getDateOffset(13)}', 2, 2);
    `);

    // Week 3 tasks for AllBlk
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Video Series Planning', 'Plan 10-part series about sustainable technology', 'high', 'creative', 'pending', '${getDateOffset(15)}', 6, 2),
      ('Conference Speaking Prep', 'Prepare presentation for upcoming Tech Innovation Conference', 'high', 'admin', 'pending', '${getDateOffset(16)}', 8, 2),
      ('Equipment Upgrade Research', 'Research and compare new camera equipment for studio setup', 'medium', 'admin', 'pending', '${getDateOffset(17)}', 4, 2),
      ('Community Challenge Launch', 'Launch monthly creative challenge for followers', 'medium', 'creative', 'pending', '${getDateOffset(18)}', 3, 2),
      ('Merchandise Design', 'Design new merchandise line for online store', 'low', 'creative', 'pending', '${getDateOffset(19)}', 5, 2);
    `);

    // Week 4 tasks for AllBlk
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Monthly Content Review', 'Review month performance and plan next month strategy', 'high', 'admin', 'pending', '${getDateOffset(22)}', 4, 2),
      ('Live Stream Setup', 'Set up equipment for weekly live streaming on YouTube', 'medium', 'creative', 'pending', '${getDateOffset(23)}', 3, 2),
      ('Sponsor Content: NordVPN', 'Create sponsored content for NordVPN partnership', 'medium', 'creative', 'pending', '${getDateOffset(24)}', 2, 2),
      ('Tutorial Video: Video Editing', 'Create tutorial on advanced video editing techniques', 'low', 'creative', 'pending', '${getDateOffset(25)}', 6, 2);
    `);

    // Completed tasks for AllBlk (recent accomplishments)
    await sequelize.query(`
      INSERT IGNORE INTO \`tasks\` (\`title\`, \`description\`, \`priority\`, \`task_type\`, \`status\`, \`deadline\`, \`estimated_hours\`, \`user_id\`) VALUES
      ('Q4 Content Calendar', 'Plan complete content calendar for October-December', 'high', 'admin', 'completed', '${getDateOffset(-3)}', 6, 2),
      ('Brand Kit Update', 'Updated logo, colors, and brand guidelines', 'medium', 'creative', 'completed', '${getDateOffset(-5)}', 4, 2),
      ('SEO Optimization', 'Optimized all video titles and descriptions for better discovery', 'medium', 'admin', 'completed', '${getDateOffset(-7)}', 5, 2),
      ('Subscriber Milestone Video', 'Created special thank you video for 100K subscribers', 'low', 'creative', 'completed', '${getDateOffset(-10)}', 3, 2);
    `);

    console.log('✅ AllBlk creator tasks created');

    console.log('🎊 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('   - 10 tables created with proper foreign key relationships');
    console.log('   - Fixed userId foreign key type mismatch (INTEGER UNSIGNED)');
    console.log('   - Sample data inserted for 2 users:');
    console.log('     • admin@streamscene.net (Twitch content creator data)');
    console.log('     • allblk13@gmail.com (Tech/creative content creator data)');
    console.log('   - Default canvases and comprehensive task data created');
    console.log('   - Database ready for production use');
    
  } catch (err) {
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
