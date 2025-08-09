// Simple in-memory file storage for demo purposes
// In production, this would be replaced with proper database persistence

interface FileRecord {
  id: number;
  userId: number;
  name: string;
  originalName: string;
  type: string;
  size: number;
  s3Key?: string;
  url: string;
  tags?: string[]; // Array of tag strings
  uploadedAt: Date;
  updatedAt: Date;
}

// In-memory storage
const fileStorage = new Map<number, FileRecord>();
let nextFileId = 1;

export class File {
  public id!: number;
  public userId!: number;
  public name!: string;
  public originalName!: string;
  public type!: string;
  public size!: number;
  public s3Key?: string;
  public url!: string;
  public tags?: string[];
  public uploadedAt!: Date;
  public updatedAt!: Date;

  constructor(data: Partial<FileRecord>) {
    Object.assign(this, data);
  }

  // Static method to find all files by user ID
  static async findAllByUserId(userId: number): Promise<File[]> {
    console.log('File.findAllByUserId called with userId:', userId);
    const userFiles = Array.from(fileStorage.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map(record => new File(record));
    
    console.log('Found files for user:', userFiles.length);
    return userFiles;
  }

  // Static method to find file by ID and user ID
  static async findByIdAndUserId(id: number, userId: number): Promise<File | null> {
    console.log('File.findByIdAndUserId called with:', { id, userId });
    const record = fileStorage.get(id);
    
    if (!record || record.userId !== userId) {
      return null;
    }
    
    return new File(record);
  }

  // Static method to create a new file
  static async create(data: Omit<FileRecord, 'id' | 'uploadedAt' | 'updatedAt'>): Promise<File> {
    console.log('File.create called with:', data);
    
    const now = new Date();
    const fileRecord: FileRecord = {
      id: nextFileId++,
      uploadedAt: now,
      updatedAt: now,
      ...data
    };
    
    fileStorage.set(fileRecord.id, fileRecord);
    console.log('File created with ID:', fileRecord.id);
    
    return new File(fileRecord);
  }

  // Instance method to delete this file
  async destroy(): Promise<boolean> {
    console.log('File.destroy called for file:', this.id);
    const deleted = fileStorage.delete(this.id);
    console.log('File deletion result:', deleted);
    return deleted;
  }

  // Instance method to save changes
  async save(): Promise<File> {
    console.log('File.save called for file:', this.id);
    this.updatedAt = new Date();
    
    const record = fileStorage.get(this.id);
    if (record) {
      // Update the stored record
      Object.assign(record, {
        name: this.name,
        originalName: this.originalName,
        type: this.type,
        size: this.size,
        s3Key: this.s3Key,
        url: this.url,
        tags: this.tags,
        updatedAt: this.updatedAt
      });
      fileStorage.set(this.id, record);
    }
    
    return this;
  }

  // Static method to get storage stats (for debugging)
  static getStorageStats() {
    return {
      totalFiles: fileStorage.size,
      files: Array.from(fileStorage.values())
    };
  }

  // Static method to find files by user ID with optional tag filtering
  static async findByUserIdWithTags(userId: number, tags?: string[]): Promise<File[]> {
    console.log('File.findByUserIdWithTags called with userId:', userId, 'tags:', tags);
    
    let userFiles = Array.from(fileStorage.values())
      .filter(file => file.userId === userId);
    
    // If tags are provided, filter by them
    if (tags && tags.length > 0) {
      userFiles = userFiles.filter(file => {
        if (!file.tags || file.tags.length === 0) return false;
        return tags.some(tag => file.tags!.includes(tag.toLowerCase()));
      });
    }
    
    // Sort by upload date (newest first) and convert to File instances
    const result = userFiles
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map(record => new File(record));
    
    console.log('Found files with tags:', result.length);
    return result;
  }

  // Static method to get all unique tags for a user
  static async getUserTags(userId: number): Promise<string[]> {
    console.log('File.getUserTags called with userId:', userId);
    
    const userFiles = Array.from(fileStorage.values())
      .filter(file => file.userId === userId);
    
    const allTags = userFiles
      .flatMap(file => file.tags || [])
      .map(tag => tag.toLowerCase())
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .sort();
    
    console.log('Found unique tags for user:', allTags);
    return allTags;
  }
}
