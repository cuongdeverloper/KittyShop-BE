const passport = require('passport');
const { upsertSocialMedia } = require('./LoginRegisterSocial');
const User = require('../../model/user');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

const doLoginWGoogle = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_APP_CLIENT_ID,
        clientSecret: process.env.GOOGLE_APP_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_APP_CLIENT_REDIRECT_LOGIN
    },
    async (accessToken, refreshToken, profile, cb) => {
        const typeAcc = 'GOOGLE';
        let dataRaw = {
            name: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : "",
        };
        // console.log('kk',profile)
        let dataUser = await upsertSocialMedia(typeAcc, dataRaw);
        // console.log('loz',dataUser)
        return cb(null, dataUser);
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        const user = await User.findById(id);
        done(null, user);
    });
}

module.exports = doLoginWGoogle;
