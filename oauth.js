
const express = require('expediate'),
    https = require('https');

// const opts = {
//   host: 'https://github.com/login',
//   userinfo: 'https://api.github.com/user',
//   client: 'xxxxxxx',
//   secret: 'xxxxxxxxx',
//   use_state: true,
//   redirect: 'https://my-web.com/oauth',
//   error: '/error.html',
//   success: '/index.html',
//   sessionSet: (req, name, val) => {}
//   sessionGet: (req, name) => {}
//   sessionUpdate: (req, data) => {}
// };

function buildKey (n, dgts) {
  n = n || 7
  const digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  dgts = dgts || digits
  let str = '';
  while (n-- > 0)
    str += dgts[parseInt(Math.random() * dgts.length)];
  return str;
}

function httpsReq(opts, url, data, callback) {
  const qry = {
    method: opts.method.toUpperCase(), 
    port: 443,
  };
  url = new URL(url);
  qry.hostname = url.host
  qry.port = url.port != '' ? parseInt(url.port) : (url.protocol == 'http' ? 80 : 443);
  qry.path = url.pathname
  qry.headers = {}

  for (var k in opts.headers)
    qry.headers[k] = opts.headers[k]

  if (data != null) {
    if (opts.type == 'json' && typeof data == 'object') {
      qry.headers['Content-Type'] = 'application/json'
      data = JSON.stringify(data);
    }
    else if (opts.type == 'form' && typeof data == 'object') {
      qry.headers['Content-Type'] = 'multipart/form-data'
      data = Object.keys(data).map(k => `${k}=${data[k]}`).join('&')
    }
    else {
      qry.headers['Content-Type'] = 'text/plain'
      data = String(data)
    }
    qry.headers['Content-Length'] = data.length
  }

  let response = '';
  let req = https.request(qry, res => {
    res.on('data', d => response += d.toString())
    res.on('end', _ => {
      if (opts.type == 'json')
	response = JSON.parse(response)
      else if (opts.type == 'form')
	response = response.split('&').reduce((r, c) => {
	  let [k, v] = c.split('=')
	  r[k] = v
	  return r;
	}, {})
      callback(null, response)
    })
  })
  req.on('error', err => callback(err))
  if (data != null)
    req.write(data)
  req.end();
}


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


function buildOAuth (opts) {

  const router = express();
  const db = {};

  router.use('/handshake', function (req, res) {
    let params = []
    params.push(`client_id=${opts.client}`)
    if (opts.use_state) {
      let state = buildKey();
      db[state] = { unix: new Date().getTime() / 1000 }
      req.session.oauth_state = state
      params.push(`state=${state}`)
    }
    if (opts.redirect)
      params.push(`redirect_url=${opts.redirect}/authenticate`)

    res.redirect(`${opts.host}/oauth/authorize?${params.join('&')}`);
  });

  router.use('/authenticate', function (req, res) {
    const qry = req.queries.url;
    let state = qry.state
    let box = db[state];
    if (box == null || box.unix < new Date().getTime() / 1000 - 300)
      return res.redirect(opts.error);
    httpsReq({ method: 'POST', type: 'form' }, `${opts.host}/oauth/access_token`, {
      client_id: opts.client,
      client_secret: opts.secret,
      scope: 'user',
      code: qry.code,
      state: qry.state,
    }, (err, res1) => {
      if (err)
        return res.redirect(opts.error);
      // opts.sessionSet(req, 'oauth_token', res1.access_token)
      httpsReq({ method: 'GET', type: 'json', headers:{
        authorization: `Bearer ${res1.access_token}`,
	'user-agent': 'kora-os.net'
      }}, `${opts.userinfo}`, null, (err, res2) => {
        if (err)
          return res.redirect(opts.error);
        opts.updateSession(req, res, res2);
        res.redirect(opts.success)
      })
    })
  });

  return router;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

function buildOAuth_p (opts) {

  sessionCheck(opts);
  const router = express.Router();

  router.use('/handshake', function (req, res) {

    // https.post(`${opts.}`)
  });


}

buildOAuth.key = buildKey;

module.exports = buildOAuth


