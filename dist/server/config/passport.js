import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User.js';
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d;
    try {
        // Find or create user
        let user = await User.findOne({ where: { google_id: profile.id } });
        if (!user) {
            user = await User.create({
                google_id: profile.id,
                email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                name: `${((_c = profile.name) === null || _c === void 0 ? void 0 : _c.givenName) || ''} ${((_d = profile.name) === null || _d === void 0 ? void 0 : _d.familyName) || ''}`.trim(),
            });
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error, null);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
