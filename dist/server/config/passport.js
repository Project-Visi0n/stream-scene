import dotenv from 'dotenv';
import path from 'path';
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js'; // Re-enable with minimal User model
console.log('GOOGLE_CLIENT_ID loaded in passport.ts:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET loaded:', process.env.GOOGLE_CLIENT_SECRET ? 'EXISTS' : 'MISSING');
console.log('GOOGLE_CALLBACK_URL loaded:', process.env.GOOGLE_CALLBACK_URL);
console.log('SESSION_SECRET loaded:', process.env.SESSION_SECRET ? 'EXISTS' : 'MISSING');
// Set up Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    var _a, _b, _c, _d;
    try {
        const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
        const photo = ((_d = (_c = profile.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) || undefined;
        if (!email) {
            return done(new Error('No email found in Google profile'), false);
        }
        let user = await User.findOne({ where: { googleId: profile.id } });
        if (!user) {
            let firstName = '';
            let lastName = '';
            if (profile.displayName) {
                const nameParts = profile.displayName.split(' ');
                firstName = nameParts[0];
                lastName = nameParts[1] || '';
            }
            user = await User.create({
                googleId: profile.id,
                firstName,
                lastName,
                email,
                profilePic: photo,
            });
        }
        return done(null, user);
    }
    catch (err) {
        console.error('Error in Google OAuth strategy:', err);
        return done(err, false);
    }
}));
// Save user ID into the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    }
    catch (err) {
        console.error('Error deserializing user:', err);
        done(err, null);
    }
});
