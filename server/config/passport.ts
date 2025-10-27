import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User.js'; 

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        console.log('🔍 Google OAuth Strategy - Profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });

        // Find or create user
        let user = await User.findOne({ where: { google_id: profile.id } });
        console.log('🔍 Database lookup result:', user ? 'User found' : 'User not found');

        if (!user) {
          console.log('🔍 Creating new user...');
          user = await User.create({
            google_id: profile.id,
            email: profile.emails?.[0]?.value,
            name: `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
          });
          console.log('✅ New user created:', { id: user.id, email: user.email });
        }

        return done(null, user);
      } catch (error) {
        console.error('❌ Error in Google strategy:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id); 
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});