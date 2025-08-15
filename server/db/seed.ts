import { getSequelize } from './index.js';
import { Task } from '../models/Task.js';
// Add other model imports as needed

async function seed() {
  const sequelize = getSequelize();
  try {
    // Example: Seed a user (if you have a Sequelize User model, otherwise skip this)
    // await User.create({
    //   email: 'admin@example.com',
    //   name: 'Admin User',
    //   google_id: 'test-google-id',
    // });

    // Example: Seed a task (update user_id to a valid user if needed)
    await Task.create({
      title: 'Welcome Task',
      description: 'This is your first seeded task!',
      priority: 'medium',
      task_type: 'admin',
      status: 'pending',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimated_hours: 2,
      user_id: 1, // Make sure this user exists
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
