var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var indexRouter = require('./routes/index');
const fs = require('fs');
const {createServer} = require("node:https");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'fullchain.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'privkey.pem')),
};
const PORT = process.env.PORT || 3000;
const httpsServer = createServer(sslOptions, app);

httpsServer.listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`Port ${PORT} requires elevated privileges`);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('An error occurred:', err);
  }
});

app.use(cors({
  origin: '*'
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
