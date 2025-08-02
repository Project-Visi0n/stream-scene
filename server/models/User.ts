// Minimal User class - NO Sequelize imports or decorators
export class User {
  id!: number;
  googleId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  profilePic?: string;

  constructor(data: any) {
    Object.assign(this, data);
  }

  static async findOne(options: any): Promise<User | null> {
    console.log('Mock User.findOne called with:', options);
    return null;
  }
  
  static async create(data: any): Promise<User> {
    console.log('Mock User.create called with:', data);
    const user = new User({ id: Math.floor(Math.random() * 1000), ...data });
    return user;
  }
  
  static async findByPk(id: number): Promise<User | null> {
    console.log('Mock User.findByPk called with:', id);
    return new User({ 
      id, 
      firstName: 'Test', 
      lastName: 'User', 
      email: 'test@example.com',
      googleId: 'test-google-id'
    });
  }
}
