import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../db/index.js'; // Fix the import - remove the .js extension and import from the db index
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        console.log('=== Google Strategy Callback ===');
        console.log('Profile ID:', profile.id);
        console.log('Profile Email:', (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value);
        console.log('Profile Name:', profile.displayName);
        // Find or create user
        let user = await User.findOne({ where: { googleId: profile.id } });
        if (!user) {
            user = await User.create({
                googleId: profile.id,
                email: (_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value,
                firstName: ((_e = profile.name) === null || _e === void 0 ? void 0 : _e.givenName) || '',
                lastName: ((_f = profile.name) === null || _f === void 0 ? void 0 : _f.familyName) || '',
                profilePicture: (_h = (_g = profile.photos) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.value,
            });
            console.log('New user created:', user.id);
        }
        else {
            console.log('Existing user found:', user.id);
        }
        return done(null, user);
    }
    catch (error) {
        console.error('Error in Google strategy:', error);
        return done(error, null);
    }
}));
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user:', id);
    try {
        const user = await User.findByPk(id);
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
