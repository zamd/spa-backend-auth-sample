var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');

const Auth0Startegy = require('passport-auth0')
      passport = require('passport'),
      CustomStrategy = require('passport-custom');


const users = require('./routes/users');


passport.serializeUser( (user, done)=> done(null,user));
passport.deserializeUser( (user, done)=> done(null,user));

var app = express();
app.use(session({secret: "shhhh", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


const auth0 = new Auth0Startegy({
  domain: "zulfiqar.auth0.com",
  clientID: "KPIfeI5dfozGJDiNBkV1vsKYI1BNCv96",
  clientSecret:"*****************",
  callbackURL: "http://loopback.com:3000",
  scope: "openid email profile offline_access",
  passReqToCallback: true

}, (req, accessToken, refreshToken, extraParams, profile, done)=>{

  //TODO: encrypt etc.
  req.session.tokenCookie = accessToken+"|"+refreshToken;
  done(null, profile);
});


function switchToSpa(req, res, next) {
  const tokenCookie = req.session.tokenCookie;
  if (tokenCookie) {
    res.cookie('encryptedToken',tokenCookie, {httpOnly: true, secure: false}); // use secure:false for local dev/test
    res.redirect('/spa');
  }
}


passport.use(auth0);
passport.use("encryptedCookieToken", new CustomStrategy(function(req,done){
  //TODO: Validate Token
  //Simulate user from session for now. 
  done(null, req.user);
}));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/spa', passport.authenticate('encryptedCookieToken'), (req,res)=>res.render('spa', {title: "SPA test"}));
app.use('/users', passport.authenticate('encryptedCookieToken'), users);
app.use('/', passport.authenticate("auth0"), switchToSpa);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
