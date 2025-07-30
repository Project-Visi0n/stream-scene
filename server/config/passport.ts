import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Sanity check log
console.log('GOOGLE_CLIENT_ID loaded in passport.ts:', process.env.GOOGLE_CLIENT_ID);

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/auth/google/callback',
},
async (accessToken, refreshToken, profile, done) => {
  const [user] = await User.findOrCreate({
    where: { googleId: profile.id },
    defaults: {
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      email: profile.emails?.[0].value,
    },
  });
  done(null, user);
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});
