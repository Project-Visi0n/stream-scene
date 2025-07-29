import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('✅ GOOGLE_CLIENT_ID loaded in passport.ts:', process.env.GOOGLE_CLIENT_ID);


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const photo = profile.photos?.[0]?.value ?? null;

        if (!email) {
          return done(new Error('No email found in Google profile'), false);
        }

        // Check if user exists
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName ?? 'User',
            email,
            profilePic: photo,
          });
        }

        return done(null, user as Express.User);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

// Session handling
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user as Express.User);
  } catch (err) {
    done(err as Error, null);
  }
});

export default passport;
