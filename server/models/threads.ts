import { 
  Table, 
  Column, 
  Model, 
  DataType, 
  ForeignKey, 
  BelongsTo, 
  HasMany,
  HasOne,  // Added missing import
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AutoIncrement
} from 'sequelize-typescript';

// Remove User model definition if it exists elsewhere, or keep it but don't export it at the end
// If User is defined in another file, import it instead:
// import { User } from './user'; // Uncomment if User is in a separate file

@Table({
  tableName: 'users',
  timestamps: true
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column(DataType.STRING)
  username!: string;

  @Column(DataType.STRING)
  email!: string;
}

@Table({
  tableName: 'threads_accounts',
  timestamps: true
})
export class ThreadsAccount extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  threads_user_id!: string;

  @Column(DataType.STRING)
  username!: string;

  @Column(DataType.STRING)
  display_name?: string;

  @Column(DataType.TEXT)
  biography?: string;

  @Column(DataType.STRING)
  profile_picture_url?: string;

  @Column(DataType.INTEGER)
  followers_count?: number;

  @Column(DataType.INTEGER)
  media_count?: number;

  @Column(DataType.BOOLEAN)
  is_verified?: boolean;

  @Column(DataType.BOOLEAN)
  is_verified_blue?: boolean;

  @Column(DataType.TEXT)
  access_token!: string;

  @Column(DataType.DATE)
  token_expires_at?: Date;

  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  @HasMany(() => ScheduledThreadsPost)
  scheduled_posts!: ScheduledThreadsPost[];

  @HasMany(() => ThreadsPost)
  posts!: ThreadsPost[];
}

@Table({
  tableName: 'scheduled_threads_posts',
  timestamps: true
})
export class ScheduledThreadsPost extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => ThreadsAccount)
  @Column(DataType.INTEGER)
  threads_account_id!: number;

  @BelongsTo(() => ThreadsAccount)
  threads_account!: ThreadsAccount;

  @Column(DataType.TEXT)
  content!: string;

  @Column(DataType.JSON)
  media_urls?: string[];

  @Column({
    type: DataType.ENUM,
    values: ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL']
  })
  media_type!: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';

  @Column(DataType.DATE)
  scheduled_time!: Date;

  @Column({
    type: DataType.ENUM,
    values: ['scheduled', 'posting', 'posted', 'failed', 'cancelled']
  })
  status!: 'scheduled' | 'posting' | 'posted' | 'failed' | 'cancelled';

  @Column(DataType.STRING)
  threads_post_id?: string;

  @Column(DataType.TEXT)
  error_message?: string;

  @Column(DataType.INTEGER)
  retry_count?: number;

  @Column(DataType.DATE)
  posted_at?: Date;

  // Reply settings
  @Column(DataType.STRING)
  reply_to_id?: string;

  @Column({
    type: DataType.ENUM,
    values: ['everyone', 'accounts_you_follow', 'mentioned_only']
  })
  reply_control?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';

  // Scheduling options
  @Column(DataType.JSON)
  scheduling_options?: {
    timezone?: string;
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
    repeat_end_date?: Date;
    tags?: string[];
  };

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  @HasOne(() => ThreadsPost, { foreignKey: 'scheduled_post_id' })
  published_post?: ThreadsPost;
}

@Table({
  tableName: 'threads_posts',
  timestamps: true
})
export class ThreadsPost extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => ThreadsAccount)
  @Column(DataType.INTEGER)
  threads_account_id!: number;

  @BelongsTo(() => ThreadsAccount)
  threads_account!: ThreadsAccount;

  @ForeignKey(() => ScheduledThreadsPost)
  @Column(DataType.INTEGER)
  scheduled_post_id?: number;

  @BelongsTo(() => ScheduledThreadsPost)
  scheduled_post?: ScheduledThreadsPost;

  @Column(DataType.STRING)
  threads_post_id!: string;

  @Column(DataType.TEXT)
  content?: string;

  @Column(DataType.JSON)
  media_urls?: string[];

  @Column({
    type: DataType.ENUM,
    values: ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL']
  })
  media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';

  @Column(DataType.STRING)
  permalink!: string;

  @Column(DataType.BOOLEAN)
  is_quote_post?: boolean;

  @Column(DataType.STRING)
  reply_to_id?: string;

  @Column(DataType.DATE)
  posted_at!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  @HasMany(() => ThreadsPostInsight)
  insights!: ThreadsPostInsight[];
}

@Table({
  tableName: 'threads_post_insights',
  timestamps: true
})
export class ThreadsPostInsight extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => ThreadsPost)
  @Column(DataType.INTEGER)
  threads_post_id!: number;

  @BelongsTo(() => ThreadsPost)
  threads_post!: ThreadsPost;

  @Column(DataType.INTEGER)
  views?: number;

  @Column(DataType.INTEGER)
  likes?: number;

  @Column(DataType.INTEGER)
  replies?: number;

  @Column(DataType.INTEGER)
  reposts?: number;

  @Column(DataType.INTEGER)
  quotes?: number;

  @Column(DataType.INTEGER)
  shares?: number;

  @Column(DataType.DATE)
  recorded_at!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}

@Table({
  tableName: 'threads_webhooks',
  timestamps: true
})
export class ThreadsWebhook extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => ThreadsAccount)
  @Column(DataType.INTEGER)
  threads_account_id!: number;

  @BelongsTo(() => ThreadsAccount)
  threads_account!: ThreadsAccount;

  @Column(DataType.STRING)
  webhook_id!: string;

  @Column({
    type: DataType.ENUM,
    values: ['mentions', 'replies', 'quote_posts', 'media_insights']
  })
  event_type!: 'mentions' | 'replies' | 'quote_posts' | 'media_insights';

  @Column(DataType.JSON)
  webhook_data?: any;

  @Column(DataType.BOOLEAN)
  processed?: boolean;

  @Column(DataType.DATE)
  received_at!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}

// Template for reusable content
@Table({
  tableName: 'threads_post_templates',
  timestamps: true
})
export class ThreadsPostTemplate extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.TEXT)
  content_template!: string;

  @Column(DataType.JSON)
  default_media_urls?: string[];

  @Column({
    type: DataType.ENUM,
    values: ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL']
  })
  media_type!: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL';

  @Column(DataType.JSON)
  tags?: string[];

  @Column({
    type: DataType.ENUM,
    values: ['everyone', 'accounts_you_follow', 'mentioned_only']
  })
  default_reply_control?: 'everyone' | 'accounts_you_follow' | 'mentioned_only';

  @Column(DataType.BOOLEAN)
  is_active!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}
