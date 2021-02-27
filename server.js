
const expediate = require('expediate'),
    fs = require('fs'),
    static = require('serve-static'),
    bodyParser = require('body-parser'),
    oauth = require('./oauth.js'),
    config = require('./config.json'),
    app = expediate();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const dbSessions = {}

const Session = {
  openSession: (ssid) => {
    if (ssid == null || dbSessions[ssid] == null) {
      ssid = oauth.key(12)
      dbSessions[ssid] = {
        ssid,
        unix: new Date().getTime() / 1000,
      };
    }
    return dbSessions[ssid];
  },
  updateSession: (req, res, data) => {
    req.session.id = `github_${data.id}`;
    req.session.login = data.login;
    req.session.avatar_url = data.avatar_url;
    req.session.name = data.name;
    req.session.location = data.location;
    req.session.email = data.email;
    res.cookie('auth', 'github');
    console.log('OAuth', req.session)
  },
};

config.github.updateSession = Session.updateSession

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

app.use((req, res, next) => {
  if (!/\.php$/.test(req.path))
    next()
});

app.use(expediate.logger());
app.use(bodyParser.json());
app.use(expediate.session({
  openSession: Session.openSession,
}));

app.use('/github', oauth(config.github));

app.use('/user', (req, res) => {
  res.send(JSON.stringify({
    login: req.session.login,
    name: req.session.name,
    email: req.session.email,
    location: req.session.location,
    avatar: req.session.avatar_url,
    id: req.session.id,
  }));
})

app.use(static(__dirname));

app.listen(443, {
  key: fs.readFileSync(__dirname + '/key.pem'),
  cert: fs.readFileSync(__dirname + '/cert.pem')
});
app.listen(80);

