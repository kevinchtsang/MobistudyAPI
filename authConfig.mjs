'use strict'

/**
* Sets-up the authentication strategy.
*/

import fs from 'fs'
import passport from 'passport'
import PassportLocal from 'passport-local'
import PassportJWT from 'passport-jwt'
import getLoggers from './logger'
import getDB from './DB/DB'
import bcrypt from 'bcrypt'

export default async function () {
  var db = await getDB()
  const loggers = await getLoggers()
  const logger = loggers.applogger

  var config = {}
  try {
    const configfile = await fs.promises.readFile('config.json', 'utf8')
    config = JSON.parse(configfile)
  } catch (err) {
    config.auth = {
      secret: (process.env.AUTH_SECRET),
      issuer: (process.env.AUTH_ISSUER),
      audience: (process.env.AUTH_AUDIENCE)
    }
  }
  // This is used for authenticating with a post
  passport.use(new PassportLocal({
    usernameField: 'email',
    passwordField: 'password'
  }, async function (email, password, done) {
    let user = await db.findUser(email)
    if (!user) {
      return done(null, false, { message: 'Incorrect email or password.' })
    } else {
      var dbHashedPwd = user.hashedPassword
      if (bcrypt.compareSync(password, dbHashedPwd)) {
        // OK!
        logger.info(email + ' logged in')
        return done(null, user, { message: 'Logged In Successfully' })
      } else {
        // wrong password!
        logger.debug(email + 'is trying to login, but wrong password')
        return done(null, false, { message: 'Incorrect email or password.' })
      }
    }
  }))

  // // this is used each time an API endpoint is called
  // var opts = {}
  // opts.jwtFromRequest = PassportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()
  // opts.secretOrKey = config.auth.secret
  // opts.issuer = config.auth.issuer
  // opts.audience = config.auth.audience
  // passport.use(new PassportJWT.Strategy(opts, function (jwtPayload, cb) {
  //   console.log(jwtPayload)
  //   let user = { role: 'admin' }
  //   return cb(null, user)
  // }))
}