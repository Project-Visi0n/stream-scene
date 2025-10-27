// Script to clean up excessive demo tasks
import { Task } from './dist/server/models/Task.js';
import { User } from './dist/server/models/User.js';
import { syncDB } from './dist/server/db/index.js';

async function cleanupDemoTasks() {
  try {
    // Initialize database
    await syncDB();
    
    // Find the demo user
    const demoUser = await User.findOne({
      where: { email: 'allblk13@gmail.com' }
    });
    
    if (!demoUser) {
      console.log('Demo user not found');
      return;
    }
    
    console.log('Demo user ID:', demoUser.id);
    
    // Count existing tasks
    const taskCount = await Task.count({
      where: { user_id: demoUser.id }
    });
    
    console.log(`Found ${taskCount} tasks for demo user`);
    
    if (taskCount > 0) {
      // Delete all tasks for demo user
      const deletedCount = await Task.destroy({
        where: { user_id: demoUser.id }
      });
      
      console.log(`Deleted ${deletedCount} tasks`);
      
      // Create a few fresh demo tasks
      const now = Date.now();
      const days = (n) => new Date(now + n * 24 * 60 * 60 * 1000);
      
      const demoTasks = [
        {
          title: 'Welcome to StreamScene',
          description: 'Explore the collaborative features and get started with your first project!',
          priority: 'medium',
          task_type: 'admin',
          status: 'pending',
          deadline: days(7),
          estimated_hours: 2,
          user_id: demoUser.id,
        },
        {
          title: 'Tech Review Script',
          description: 'Write script for iPhone 16 review video',
          priority: 'high',
          task_type: 'creative',
          status: 'in_progress',
          deadline: days(0),
          estimated_hours: 4,
          user_id: demoUser.id,
        },
        {
          title: 'Thumbnail Design',
          description: 'Create eye-catching thumbnail for review video',
          priority: 'medium',
          task_type: 'creative',
          status: 'pending',
          deadline: days(1),
          estimated_hours: 2,
          user_id: demoUser.id,
        },
      ];
      
      await Task.bulkCreate(demoTasks);
      console.log('Created 3 fresh demo tasks');
    }
    
    console.log('Cleanup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDemoTasks();