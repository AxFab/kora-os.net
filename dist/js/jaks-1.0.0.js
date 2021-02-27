"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var jaks = {};

(function (jaks, $) {
  jaks.fn = {};
  jaks.dt = {};
  jaks.app = {};
  jaks._widgets = {};
  jaks._instances = {};
  jaks.exprRegex = /\{([^<>{}]+)\}/g;
  jaks.exprRegex2 = /\{\{([^<>{}]+)\}\}/g;
  jaks.trimRegex = /^\s+|\s+$/g;

  jaks.setImmediate = function (func) {
    return setTimeout(func, 1);
  };

  jaks.newKey = function (len) {
    len = len || 7;
    var digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var key = '';

    for (var i = 0; i < len; ++i) {
      key += digits[parseInt(Math.random() * digits.length)];
    }

    return key;
  }; // jaks.pluginCall = function(dom, fn, load, opts) {
  //   if (opts.template == null) {
  //     opts.template = dom.innerHTML;
  //   }
  //   if (load) {
  //     dom.innerHTML = ''
  //     jaks.provider(opts.provider, '', (err, data) => {
  //       if (err) {
  //         delete opts.data
  //         opts.err = err
  //         opts.load = false;
  //       } else {
  //         delete opts.err
  //         opts.data = data
  //         opts.load = true;
  //       }
  //       dom.innerHTML = ''
  //       fn(dom, opts)
  //     })
  //   } else {
  //     delete opts.data
  //     delete opts.err
  //     opts.load = false;
  //     dom.innerHTML = ''
  //     fn(dom, opts);
  //   }
  // };
  // jaks.initialize = function () {
  //   $('*[jaks]').each((i, x) => {
  //     let nm = $(x).attr('jaks');
  //     let fn = jaks.fn[nm];
  //     if (fn == null)
  //       return console.error(`Unknown jaks-plugin '${nm}'`);
  //     let key = $(x).attr('jaks-data');
  //     if (key == null || key == '') {
  //       key = jaks.newKey();
  //       jaks.dt[key] = {
  //         key: key,
  //         provider: $(x).attr('jaks-provider'),
  //         skin: $(x).attr('jaks-skin'),
  //         plugin: nm
  //       }
  //     }
  //     jaks.pluginCall(x, fn, true, jaks.dt[key]);
  //     // fn(x, true, jaks.dt[key]);
  //   });
  // }


  if ($) {
    $(function () {
      jaks._initialize();
    });
  }
})(jaks, jQuery); // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


(function (jaks, $) {
  jaks.formatProperty = function (value, type, format) {
    switch (type) {
      case 'mkdown':
        return jaks.markdownToHtml(value);

      case 'date':
        return moment(value).format(format);

      default:
        return value;
    }
  };

  jaks.replaceProperty = function (prop, data) {
    // Get value
    var prt = prop.split('|');
    var value = jaks.eval(prt[0], data);
    if (prt.length < 2) return value; // return jaks.formatProperty(value, prt[1]);
    // Get type

    var format = '',
        type = prt[1];
    var k = type.indexOf(':');

    if (k > 0) {
      format = type.substring(k + 1).replace(jaks.trimRegex, '');
      type = type.substring(0, k).replace(jaks.trimRegex, '');
    } else {
      type = type.replace(jaks.trimRegex, '');
    } // Correct format


    if (format[0] == '"' || format[0] == "'") format = jaks.Parser.stringFromLitteral(format);
    return jaks.formatProperty(value, type, format);
  };

  jaks.markdownToHtml = function (text, opts) {
    return marked(text);
  };

  var DomParser = /*#__PURE__*/function () {
    function DomParser(template, instance) {
      _classCallCheck(this, DomParser);

      this._template = template; // this._data = data;

      this._instance = instance;
      this.regexTag = /^<([a-zA-Z0-9_-]+)([^<>]+)?>/;
      this.regexEnd = /^<\/([a-zA-Z0-9_-]+)>/;
      this.regexComment = /^<!--.*-->/;
      this.regexAttribute = new RegExp("([-a-zA-Z.:@]*)=(\"([^\"]*)\"|'([^']*)')");
      this.regexFor = /([a-zA-Z0-9_.]+) in (.+)/;
    }

    _createClass(DomParser, [{
      key: "parseTag",
      value: function parseTag(name, attributes) {
        var _this = this;

        var dom = $('<' + name + '>');
        var jFor = null;
        var jIf = true; // Parse attributes

        while (attributes && attributes.length > 0) {
          attributes = attributes.replace(/^\s+/, '');
          var matchAttribute = this.regexAttribute.exec(attributes);
          if (matchAttribute == null) break;

          if (matchAttribute[1][0] == ':') {
            matchAttribute[1] = matchAttribute[1].substring(1);
            var val = matchAttribute[3].replace(jaks.exprRegex, function (x, g) {
              return jaks.eval(g, _this._data);
            });
            dom.attr(matchAttribute[1], val);
          } else if (matchAttribute[1][0] == '@') {
            (function () {
              var eventName = matchAttribute[1].substring(1);
              var funcName = matchAttribute[3];
              dom.on(eventName, function (ev) {
                var func = _this._instance[funcName];
                if (func) func.call(_this._instance, ev, _this._data);
              });
            })();
          } else if (matchAttribute[1] == 'jaks-if') {
            jIf = jaks.eval(matchAttribute[2], this._data);
          } else if (matchAttribute[1] == 'jaks-for') {
            jFor = this.regexFor.exec(matchAttribute[3]);
          } else {
            dom.attr(matchAttribute[1], matchAttribute[3]);
          }

          attributes = attributes.substring(matchAttribute[0].length);
        }

        if (this._parent) {
          if (jIf) this._parent.append(dom);
        } else this._master = dom;
      }
    }, {
      key: "parse",
      value: function parse(template) {
        var _this2 = this;

        while (template && template.length > 0) {
          // Handle spaces
          var spaces = template.match(/^\s+/);

          if (spaces != null) {
            template = template.substring(spaces[0].length);
            if (this._parent) this._parent.append(spaces[0]);
          }

          var matchTag = template.match(this.regexTag);

          if (matchTag) {
            this.parseTag(matchTag[1], matchTag[2]);
            template = template.substring(matchTag[0].length);
            continue;
          }

          var matchEnd = template.match(this.regexEnd);

          if (matchEnd) {
            template = template.substring(matchEnd[0].length);
            continue;
          }

          var matchComment = template.match(this.regexComment);

          if (matchComment) {
            template = template.substring(matchComment[0].length);
            continue;
          }

          var nextChevron = template.indexOf('<');
          if (nextChevron <= 0) throw new new Error("Unexpected: " + template)();
          var text = template.substring(0, nextChevron);
          template = template.substring(nextChevron);
          text = text.replace(jaks.exprRegex2, function (x, g) {
            return jaks.replaceProperty(g, _this2._data);
          });
          if (this._parent) this._parent.append(text);
        }
      }
    }]);

    return DomParser;
  }();

  jaks.DomParser = DomParser;

  jaks.evalTemplate = function (template, data, parent, instance) {
    var model = null; // console.log('EVAL', parent != null ? parent[0] : null, template)

    while (template && template.length > 0) {
      var m = template.match(/^\s+/);

      if (m != null) {
        template = template.substring(m[0].length);
        if (parent != null) parent.append(m[0]);
      }

      var ms = template.match(/^<([a-zA-Z0-9_-]+)([^<>]+)?>/);
      var me = template.match(/^<\/([a-zA-Z0-9_-]+)>/);
      var cm = template.match(/^<!--.*-->/);
      var k = template.indexOf('<');

      if (ms) {
        model = $("<".concat(ms[1], ">"));
        template = template.substring(ms[0].length);
        var repeat = null;
        var re = new RegExp("([-a-zA-Z.:@]*)=(\"([^\"]*)\"|'([^']*)')");
        var at = ms[2];

        while (at && at.length > 0) {
          at = at.replace(/^\s+/, '');
          var e = re.exec(at);
          if (e == null) break;

          if (e[1][0] == ':') {
            var val = e[3].replace(jaks.exprRegex, function (x, g) {
              return jaks.eval(g, data);
            });
            model.attr(e[1].substring(1), val);
          } else if (e[1][0] == '@') {
            (function () {
              e[1] = e[1].substring(1);
              var nm = e[1];
              var fn = e[3]; // console.log('Attr Event', e[1], e[3], model);
              // console.log('Registered event', nm, fn, instance)

              model.on(nm, function (ev) {
                var func = instance[fn];
                if (func) func.call(instance, ev, data);
              });
            })();
          } else if (e[1] == 'jaks-if') {} else if (e[1] == 'jaks-for') {
            repeat = e[3].match(/([a-zA-Z0-9_.]+) in ([a-zA-Z0-9_.]+)/); // console.log('FIND jask DATA !?', e[3], repeat);
          } else {
            model.attr(e[1], e[3]);
          } // console.log('Attr', e[1], e[3])


          at = at.substring(e[0].length);
        }

        if (parent) parent.append(model);
        var ignore = ['IMG', 'HR', 'INPUT'];

        if (ignore.indexOf(ms[1].toUpperCase()) < 0) {
          if (!repeat) template = jaks.evalTemplate(template, data, model, instance);else {
            var arr = jaks.eval(repeat[2], data);
            if (!Array.isArray(arr)) arr = [];
            var nextT = void 0;

            for (var i in arr) {
              var obj = {}; // Copy of data !?

              obj[repeat[1]] = arr[i];
              nextT = jaks.evalTemplate(template, obj, model, instance);
            }

            template = nextT;
          } // console.warn('EVAL', 'after', ms[1])
        }

        if (parent == null) return model; // After last </div> ?
      } else if (me) {
        // console.warn('EVAL', 'closing', me[0])
        return template.substring(me[0].length); // Not matching
      } else if (k > 0) {
        var text = template.substring(0, k);
        template = template.substring(k);
        text = text.replace(jaks.exprRegex2, function (x, g) {
          return jaks.replaceProperty(g, data);
        });
        if (parent) parent.append(text);
      } else if (cm) {
        template = template.substring(cm[0].length); // console.warn('Comment happend', cm)
      } else {
        console.warn('What happend', template);
        return null;
      }
    }
  };

  jaks.evaluateFlatTemplate = function (template, data, instance) {
    var M = jaks.evalTemplate(template, data, null, instance); // console.log('MODEL', M[0].outerHTML, template);

    return M[0];
  };
})(jaks, jQuery); // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


(function (jaks, $) {
  jaks.fn.list = function (dom, opts) {
    if (!opts.load) return;
    if (opts.err) throw err;
    dom.innerHTML = '';
    var arr = opts.data.data;

    for (var i = 0, n = arr.length; i < n; ++i) {
      $(dom).append(jaks.evaluateFlatTemplate(opts.template, arr[i]));
    }
  };

  jaks.fn.data = function (dom, opts) {
    if (!opts.load) return;
    if (opts.err) throw err;
    $(dom).append(jaks.evaluateFlatTemplate(opts.template, opts.data));
  };

  jaks.fn.mkdown = function (dom, opts) {
    if (!opts.load) return;
    if (opts.err) throw err;
    dom.innerHTML = jaks.markdownToHtml(opts.data);
  }; // ---------------


  var buildCell = {};

  buildCell.string = function (item, col, val) {
    return $('<span>').text(val);
  };

  buildCell.link = function (item, col, val) {
    var link = col.format.replace(jaks.exprRegex, function (x, g) {
      return jaks.replaceProperty(g, item);
    });
    return $('<span>').append($('<a>').text(val).attr('href', link));
  };

  buildCell.users = function (item, col, val) {
    var cell = $('<div>').attr('class', 'jaks-users');

    for (var k in val) {
      var img = $('<img>').attr('alt', val[k].name).attr('title', val[k].name).attr('src', val[k].avatar);
      cell.append(img);
    }

    return cell;
  };

  buildCell.format = function (item, col, val) {
    val = jaks.formatProperty(val, col.type, col.format);
    return $('<span>').text(val);
  };

  var buildTableArray = function buildTableArray(dataset) {
    var headers = $('<tr>');

    for (var i in dataset.columns) {
      var _col = dataset.columns[i];
      var th = $('<th>').text(_col.title);
      if (_col.width) th.attr('width', _col.width);
      headers.append(th);
    }

    var tbody = $('<tbody>');

    for (var i in dataset.data) {
      var tr = $('<tr>');

      for (var j in dataset.columns) {
        var col = dataset.columns[j];
        var val = jaks.eval(col.name, dataset.data[i]);
        var fn = buildCell[col.type];
        if (fn == null) fn = buildCell.format;
        tr.append($('<td>').append(fn(dataset.data[i], col, val)));
      }

      tbody.append(tr);
    }

    return $('<table>').attr('class', 'table').append($('<thead>').append(headers), tbody);
  };

  jaks.fn.table = function (dom, opts) {
    if (!opts.load) return;
    if (opts.err) throw err;
    $(dom).append(buildTableArray(opts.data));
    console.log('Table', opts.data);
  };

  jaks.fn.page = function (dom, opts) {
    if (!opts.load) return;
    if (opts.err) throw err;
    $(dom).text(JSON.stringify(opts.data, null, 2));
  };
})(jaks, jQuery); // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


(function (jaks, $) {
  jaks.pursueAsync = function (task) {
    var _this3 = this;

    return function (next) {
      jaks.setImmediate(function (_) {
        task.call(_this3);
      });
      next();
    };
  };

  var Widget = /*#__PURE__*/function () {
    function Widget(dom, model) {
      _classCallCheck(this, Widget);

      this.dom = dom;

      for (var k in model) {
        if (this[k] === undefined) this[k] = model[k];else console.warn('Reserved widget property: ' + k);
      }

      var nope = function nope(next) {
        next();
      };

      this.onInit = this.onInit || nope;
      this.onCreated = this.onCreated || nope;
      this.onUpdate = this.onUpdate || nope;
      this.onRendered = this.onRendered || nope; // this.onHide = this.onHide || nope
      // this.onShow = this.onShow || nope

      this.onDestroy = this.onDestroy || nope;
      this.render = this.render || Widget.defaultRender;
    }

    _createClass(Widget, [{
      key: "_init",
      value: function _init() {
        var _this4 = this;

        if (this.debug) console.log('_init');
        this.onInit.call(this, function (_) {
          try {
            _this4._readParams();

            _this4._setupDefaultRender();

            _this4.onCreated.call(_this4, function (_) {
              return jaks.setImmediate(function (_) {
                return _this4._update();
              });
            });
          } catch (ex) {
            console.error(ex);
          }
        });
      }
    }, {
      key: "_update",
      value: function _update() {
        var _this5 = this;

        if (this.debug) console.log('_update');
        this.onUpdate.call(this, function (_) {
          try {
            _this5.render();

            _this5.onRendered.call(_this5, function (_) {
              return 0;
            });
          } catch (ex) {
            console.error(ex);
          }
        });
      }
    }, {
      key: "_destroy",
      value: function _destroy() {
        this.dom.innerHTML = '';
        this.onDestroy.call(this);
      }
    }, {
      key: "_readParams",
      value: function _readParams() {
        if (this.debug) console.log('_readParams');
        this.params = {};

        if (this.properties) {
          for (var i = 0, n = this.properties.length; i < n; ++i) {
            var name = this.properties[i];
            var val = $(this.dom).attr(name);
            val = val.replace(jaks.exprRegex, function (x, e) {
              return jaks.eval(e, {});
            });
            this.params[name] = val;
          }
        }
      }
    }, {
      key: "_setupDefaultRender",
      value: function _setupDefaultRender() {
        if (this.debug) console.log('_setupDefaultRender');

        if (!this.template) {
          this.template = this.dom.innerHTML.replace(jaks.trimRegex, '');
          this.dom.innerHTML = '';
          if (this.template == '') delete this.template;
        }

        if (this.template) this.renderer = new jaks.DomParser(this.template, this);
      }
    }]);

    return Widget;
  }();

  Widget.defaultRender = function () {
    if (this.debug) console.log('defaultRender', this.template, this.data);

    if (this.template) {
      var content = jaks.evaluateFlatTemplate(this.template, this.data, this);
      if (this.debug) console.log('defaultRender', content.outerHTML);
      $(this.dom).empty();
      $(this.dom).append(content);
    }
  };

  jaks._initialize = function () {
    $('*[jaks]').each(function (idx, dom) {
      var name = $(dom).attr('jaks');
      var key = $(dom).attr('jaks-uid');

      if (key == null) {
        var plugin = jaks._widgets[name];
        if (plugin == null) return console.error("Unknown jaks-widget '".concat(name, "'"));
        var widget = new Widget(dom, plugin);
        widget._uid = jaks.newKey(9);
        $(dom).attr('jaks-uid', widget._uid);
        jaks._instances[widget._uid] = widget;
        jaks.setImmediate(function (_) {
          return widget._init();
        });
      } else {
        var _widget = jaks._instances[key]; // setImmediate(_ => widget._init())
      }
    });
  };

  jaks.widget = function (name, ctrl) {
    jaks._widgets[name] = ctrl; // function(dom, opts) {
    //   if (!opts.load) return;
    //   if (opts.err) throw err;
    //   let instance = {}
    //   for (var k in ctrl)
    //     instance[k] = ctrl[k];
    //   console.log('call widget page')
    //   instance.refresh = function() {
    //     dom.innerHTML = '';
    //     this.beforeUpdate(() => {
    //       console.log('WIDGET', this.template, this.data)
    //       $(dom).append(jaks.evaluateFlatTemplate(this.template, this.data, instance));
    //     });
    //   }
    //   instance.refresh.call(instance);
    // }
  }; // ------------


  jaks.notify = function (level, message, template) {};

  jaks.targetElement = function (dom, tag) {
    while (dom.tagName != 'A') {
      dom = dom.parentElement;
    }

    return dom;
  };

  jaks.widget('page', {
    onUpdate: function onUpdate(callback) {
      var _this6 = this;

      var url = $(this.dom).attr('jaks-provider');
      jaks.getJSON(url, function (err, res, xhr) {
        if (err) return jaks.notify('error', 'Unable to fetch data');
        _this6.data = res;
        callback();
      });
    }
  });
  jaks.widget('mkdown', {
    onUpdate: function onUpdate(callback) {
      var _this7 = this;

      var url = $(this.dom).attr('jaks-provider');
      jaks.get(url, function (err, res, xhr) {
        if (err) return jaks.notify('error', 'Unable to fetch data');
        _this7.data = {};
        _this7.template = "<div>".concat(marked(res), "</div>");
        callback();
      });
    }
  }); // ------------

  jaks._i18n_default = 'en';

  jaks.setLanguage = function (lang) {
    jaks.getJSON("/lang/".concat(lang, ".json"), function (err, res) {
      if (err) {
        console.warn("Language '".concat(lang, "' not available for jaks-i18n"));
        if (lang.length > 2) jaks.setLanguage(lang.substring(0, 2));else if (lang != jaks._i18n_default) jaks.setLanguage(jaks._i18n_default);
        return;
      }

      jaks._i18n = lang;
      jaks._i18n_tr = res;
      jaks.applyLang();
    });
  };

  jaks.applyLang = function (selector) {
    $('*[jaks-i18n]', selector).each(function (i, x) {
      var key = $(x).attr('jaks-i18n');
      var val = jaks.eval(key, jaks._i18n_tr);
      $(x).text(val);
    });
  };

  $(function () {
    jaks.setLanguage(navigator.language);
  });
})(jaks, jQuery);

(function (jaks, $) {
  jaks._ajax = function (req) {
    req.callback = req.callback || function () {};

    var xhr = new XMLHttpRequest();

    xhr.onload = function () {
      if (xhr.status != 200) {
        // analyze HTTP status of the response
        req.callback({
          code: xhr.status
        }, null, xhr); // alert(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
      } else {
        // show the result
        req.callback(null, xhr.response, xhr); // alert(`Done, got ${xhr.response.length} bytes`); // response is the server response
      }
    };

    xhr.open(req.type, req.url, true);
    xhr.timeout = req.timeout || 10000;
    xhr.responseType = req.dataType || 'json';
    xhr.setRequestHeader('Content-Type', req.contentType || 'application/json');
    xhr.send(req.data);
  };

  jaks.get = function (url, callback) {
    return jaks._ajax({
      url: url,
      type: 'GET',
      callback: callback,
      dataType: 'text'
    });
  };

  jaks.getJSON = function (url, callback) {
    return jaks._ajax({
      url: url,
      type: 'GET',
      callback: callback,
      dataType: 'json'
    });
  };

  jaks.putJSON = function (url, data, callback) {
    if (typeof data === 'function') {
      callback = data;
      data = null;
    }

    return jaks._ajax({
      url: url,
      type: 'PUT',
      callback: callback,
      data: data ? JSON.stringify(data, null, 2) : null,
      contentType: 'application/json',
      dataType: 'json'
    });
  };

  jaks.postJSON = function (url, data, callback) {
    if (typeof data === 'function') {
      callback = data;
      data = null;
    }

    return jaks._ajax({
      url: url,
      type: 'POST',
      callback: callback,
      data: data ? JSON.stringify(data, null, 2) : null,
      contentType: 'application/json',
      dataType: 'json'
    });
  };

  jaks.provider = function (provider, opts, callback) {
    if (provider == null || provider == '') {
      return callback(null, null);
    }

    provider = provider.replace(/\{([^<>{}]+)\}/g, function (x, g) {
      return jaks.replaceProperty(g, {
        lang: 'en'
      });
    }); // If this is an URL

    if (provider[0] === '/') return $.get(provider, function (res) {
      if (/\.json$/.test(provider) && typeof res === 'string') res = JSON.parse(res);
      callback(null, res);
    }).fail(function (err) {
      callback(err);
    });
    callback('Unknown');
  };
})(jaks, jQuery);

(function (jaks, $) {
  var arrayPop = function arrayPop(arr) {
    return arr.splice(arr.length - 1, 1)[0];
  };

  var arrayPeek = function arrayPeek(arr) {
    return arr[arr.length - 1];
  };

  var Lexer = /*#__PURE__*/function () {
    function Lexer(data) {
      _classCallCheck(this, Lexer);

      this._data = data;
      this._opts = {
        savedToken: null,
        operators: ['+', '-', '*', '/', '%', // Arithmetics
        '<', '<=', '>=', '>', '==', '!=', // Compare
        '.', '&&', '||', '!', // Logic
        '~', '&', '|', '^', '<<', '>>', // Binary
        '\'', '"', '/*', '//', // Sequence openers
        '?', ':', '(', ')'],
        sequence: {
          '\'': {
            end: '\'',
            escape: '\\',
            type: 'litteral'
          },
          '"': {
            end: '\'',
            escape: '"',
            type: 'litteral'
          },
          '/*': {
            end: '*/',
            type: 'comment'
          },
          '//': {
            end: '\n',
            type: 'comment'
          }
        }
      };
    }

    _createClass(Lexer, [{
      key: "_trimStart",
      value: function _trimStart() {
        while (' \t\n\r'.indexOf(this._data[0]) >= 0) {
          this._data = this._data.substring(1);
        }
      }
    }, {
      key: "_peekChar",
      value: function _peekChar(mayThrow) {
        if (this._data.length == 0) return mayThrow === true ? new Error('Unexpected end of data') : null;
        return this._data[0];
      }
    }, {
      key: "_readChar",
      value: function _readChar(mayThrow) {
        if (this._data.length == 0) return mayThrow === true ? new Error('Unexpected end of data') : null;
        var nx = this._data[0];
        this._data = this._data.substring(1);
        return nx;
      }
    }, {
      key: "_checkOperator",
      value: function _checkOperator(val) {
        var len = val.length;
        var count = 0;

        for (var i = 0, n = this._opts.operators.length; i < n; ++i) {
          if (this._opts.operators[i].substring(0, len) == val) count++;
        }

        return count;
      }
    }, {
      key: "_readToken",
      value: function _readToken() {
        this._trimStart();

        var nx = this._peekChar();

        if (nx == null) return null; // Check against known symbols

        var o = this._checkOperator(nx);

        if (o > 0) {
          this._readChar();

          while (o != 1) {
            var nnxOpe = nx + this._peekChar(true);

            o = this._checkOperator(nnxOpe);
            if (o == 0) break;

            this._readChar(true);

            nx = nnxOpe;
          } // Is this an operator or a sequence


          var seq = this._opts.sequence[nx];
          if (!seq) return {
            t: 'operator',
            l: nx
          };
          var nnxSeq = nx;

          for (;;) {
            nnxSeq += this._readChar(true); // if (nnxSeq.length > 180)
            //   return nnxSeq;

            if (nnxSeq[nnxSeq.length - 1] == seq.end && (seq.escape == null || nnxSeq[nnxSeq.length - 2] != seq.escape)) return {
              t: seq.type,
              l: nnxSeq
            };
          }
        } // Check numbers


        if (/[0-9]/.test(nx)) {
          var nnx = '';

          while (nx && /[.0-9]/.test(nx)) {
            nnx += this._readChar();
            nx = this._peekChar();
          }

          return {
            t: 'number',
            l: nnx
          };
        } // Check identifier


        if (/[a-zA-Z_]/.test(nx)) {
          var _nnx = '';

          while (nx && /[0-9a-zA-Z_]/.test(nx)) {
            _nnx += this._readChar();
            nx = this._peekChar();
          }

          return {
            t: 'identifier',
            l: _nnx
          };
        }

        this._readChar();

        return {
          t: 'error',
          n: '#Err(' + nx + ')'
        };
      }
    }, {
      key: "peek",
      value: function peek() {
        if (this._opts.savedToken == null) this._opts.savedToken = this._readToken();
        return this._opts.savedToken;
      }
    }, {
      key: "read",
      value: function read() {
        var last = this._opts.savedToken;
        if (last == null) last = this._readToken();
        this._opts.savedToken = null;
        if (this.debug === true) if (last) console.log("Lexer read '".concat(last.l, "' matching '").concat(last.t, "'"));else console.log("Lexer read end of expression");
        return last;
      }
    }]);

    return Lexer;
  }();

  var Parser = /*#__PURE__*/function () {
    function Parser() {
      _classCallCheck(this, Parser);

      this._postfixStack = [];
      this._infixStack = [];
      this._parenthesis = 0;
      this._subParser = null;
      this._state = Parser.STATE_START;
      this._opcode = {
        '(': {
          priority: 99,
          assoc: 'L2R',
          operands: 0
        },
        'x': {
          priority: 0,
          assoc: 'L2R',
          operands: 0
        },
        // Unitary Operators
        // '++sfx': { priority: 2, assoc: 'L2R', operands: 1, mnemonic:'INC' },
        // '--sfx': { priority: 2, assoc: 'L2R', operands: 1, mnemonic:'DEC' },
        // '++pfx': { priority: 3, assoc: 'R2L', operands: 1, mnemonic:'INC' },
        // '--pfx': { priority: 3, assoc: 'R2L', operands: 1, mnemonic:'DEC' },
        '!': {
          priority: 3,
          assoc: 'R2L',
          operands: 1,
          mnemonic: 'NOT'
        },
        '~': {
          priority: 3,
          assoc: 'R2L',
          operands: 1
        },
        // Binary Operators
        '.': {
          priority: 1,
          assoc: 'L2R',
          operands: 2
        },
        '.?': {
          priority: 1,
          assoc: 'L2R',
          operands: 2
        },
        '()': {
          priority: 2,
          assoc: 'L2R',
          operands: 2
        },
        '*': {
          priority: 5,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'MUL'
        },
        '/': {
          priority: 5,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'DIV'
        },
        '%': {
          priority: 5,
          assoc: 'L2R',
          operands: 2
        },
        '+': {
          priority: 6,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'ADD'
        },
        '-': {
          priority: 6,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'SUB'
        },
        '<<': {
          priority: 7,
          assoc: 'L2R',
          operands: 2
        },
        '>>': {
          priority: 7,
          assoc: 'L2R',
          operands: 2
        },
        '<': {
          priority: 8,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'lt'
        },
        '>': {
          priority: 8,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'gt'
        },
        '<=': {
          priority: 8,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'le'
        },
        '>=': {
          priority: 8,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'ge'
        },
        '==': {
          priority: 9,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'eq'
        },
        '!=': {
          priority: 9,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'neq'
        },
        '&': {
          priority: 10,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'AND'
        },
        '^': {
          priority: 11,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'XOR'
        },
        '|': {
          priority: 12,
          assoc: 'L2R',
          operands: 2,
          mnemonic: 'OR'
        },
        '&&': {
          priority: 13,
          assoc: 'L2R',
          operands: 2
        },
        '||': {
          priority: 14,
          assoc: 'L2R',
          operands: 2
        },
        '??': {
          priority: 15,
          assoc: 'R2L',
          operands: 2
        },
        '=': {
          priority: 15,
          assoc: 'R2L',
          operands: 2
        },
        // 'throw': { priority: 16, assoc: 'R2L', operands: 2 },
        ',': {
          priority: 17,
          assoc: 'L2R',
          operands: 2
        },
        // Ternary Operators
        '?': {
          priority: 15,
          assoc: 'R2L',
          operands: 3
        },
        ':': {
          priority: 15,
          assoc: 'R2L',
          operands: 3
        }
      };
    }

    _createClass(Parser, [{
      key: "_state",
      value: function _state(state) {
        if (state == Parser.STATE_OPERAND) {
          if (this._state != Parser.STATE_START && this._state != Parser.STATE_BINARY_OPERATOR && this._state != Parser.STATE_UNARY_OPERATOR_LEFT_RIGHT) throw Error("Unexpected operand"); // } else if (state == ) {
        }

        this._state = state;
      }
    }, {
      key: "_pushOperator",
      value: function _pushOperator(node) {
        if (node.o.operands == 1) {
          if (this._postfixStack.length < 1) throw new Error("Missing operand for the operator: " + node.l);
          node.R = arrayPop(this._postfixStack);
          if (this.debug) console.log("Parser pop '".concat(node.R.l, "' from in-fix-stack as '").concat(node.l, "' operand"));
        } else if (node.o.operands == 2) {
          if (this._postfixStack.length < 2) throw new Error("Missing operands for the operator: " + node.l);
          node.R = arrayPop(this._postfixStack);
          node.L = arrayPop(this._postfixStack);
          if (this.debug) console.log("Parser pop '".concat(node.R.l, "' from in-fix-stack as right '").concat(node.l, "' operand"));
          if (this.debug) console.log("Parser pop '".concat(node.L.l, "' from in-fix-stack as left '").concat(node.l, "' operand"));
        } else if (node.o.operands == 3) {
          if (this._infixStack.length < 1) throw new Error("Missing operator for ternary operator: " + node.l);
          if (this._postfixStack.length < 3) throw new Error("Missing operands for the operator: " + node.l);

          if (node.l == ':' && arrayPeek(this._infixStack).l == '?') {
            node = arrayPop(this._infixStack);
            node.R = arrayPop(this._postfixStack);
            node.L = arrayPop(this._postfixStack);
            node.C = arrayPop(this._postfixStack);
            if (this.debug) console.log("Parser pop '".concat(node.R.l, "' from in-fix-stack as right '").concat(node.l, "' operand"));
            if (this.debug) console.log("Parser pop '".concat(node.L.l, "' from in-fix-stack as left '").concat(node.l, "' operand"));
            if (this.debug) console.log("Parser pop '".concat(node.C.l, "' from in-fix-stack as condition '").concat(node.l, "' operand"));
          } else {
            throw new Error("Unknonw ternary operator: " + arrayPeek(this._infixStack).l + " / " + node.l);
          }
        } else {
          throw new Error("Invalid operator: " + node.l);
        } //


        if (this.debug) console.log("Parser] add '".concat(node.l, "' to post-fix stack"));

        this._postfixStack.push(node);
      }
    }, {
      key: "push",
      value: function push(token) {
        if (this.debug) console.log("Parser push '".concat(token.l, "'"));

        if (token.l == ')') {
          if (this.parenthesis == 0) throw 'Unexpected token ), no openning parenthese';

          var _o = arrayPop(this._infixStack);

          if (this.debug) console.log("Parser pop '".concat(_o.l, "' from in-fix-stack"));

          while (_o.l != '(') {
            this._pushOperator(_o);

            if (this._infixStack.length == 0) throw 'Unexpected token ), no openning parenthese';
            _o = arrayPop(this._infixStack);
            if (this.debug) console.log("Parser pop '".concat(_o.l, "' from in-fix-stack"));
          }

          this.parenthesis--;
          return true;
        }

        if (this._subParser != null) return this._subParser.push(token);

        if (token.l == '(') {
          this._parenthesis++;
          if (this.debug) console.log("Parser add '".concat(token.l, "' to in-fix-stack"));

          this._infixStack.push({
            t: 'parenthesis',
            l: token.l,
            o: this._opcode['(']
          });
        } else if (token.t == 'operator') {
          var op = {
            t: token.t,
            l: token.l,
            o: this._opcode[token.l]
          }; // this._state(op.state);

          var pk = arrayPeek(this._infixStack);

          while (this._infixStack.length > 0 && (pk.o.priority < op.o.priority || pk.o.priority == op.o.priority && pk.o.assoc == 'L2R')) {
            var node = arrayPop(this._infixStack);
            if (this.debug) console.log("Parser pop '".concat(o.l, "' from in-fix-stack"));

            this._pushOperator(node);

            pk = arrayPeek(this._infixStack);
          }

          this._infixStack.push(op);
        } else {
          if (this.debug) console.log("Parser add '".concat(token.l, "' to post-fix-stack")); // this._state(Parser.STATE_OPERAND);

          this._postfixStack.push({
            t: token.t,
            l: token.l,
            o: this._opcode['x']
          });
        }
      }
    }, {
      key: "resolve",
      value: function resolve(data) {
        if (!this._result) {
          // P._pushOperator(arrayPop(P._infixStack))
          while (this._infixStack.length > 0) {
            var node = arrayPop(this._infixStack);
            if (this.debug) console.log("Parser pop '".concat(node.l, "' from in-fix-stack for post-fix stack"));

            this._pushOperator(node);
          }

          if (this._postfixStack.length != 1) throw new Error("Unexpected error, unable to resolve the expression");
          this._result = arrayPop(this._postfixStack);
          if (this.debug) console.log("Parser pop '".concat(this._result.l, "' from post-fix-stack as primary node"));
          Parser.checkNode(this._result);
        }

        Parser.exec(this._result, data);
        return this._result.value;
      }
    }]);

    return Parser;
  }();

  Parser.stringFromLitteral = function (txt) {
    // let t1 = txt;
    txt = txt.substring(1, txt.length - 1);
    txt = txt.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n").replace("\\t", "\t"); // console.log('Str', t1, '=>', txt)

    return txt;
  };

  Parser.computeUnaryOpcode = function (lf, op) {
    switch (op) {
      case '!':
        return !lf;

      case '~':
        return ~lf;

      default:
        throw 'N/I';
    }
  };

  Parser.computeBinaryOpcode = function (lf, op, rg) {
    switch (op) {
      case '*':
        return lf * rg;

      case '/':
        return lf / rg;

      case '%':
        return lf % rg;

      case '+':
        return lf + rg;

      case '-':
        return lf - rg;

      case '<':
        return lf < rg;

      case '>':
        return lf > rg;

      case '<=':
        return lf <= rg;

      case '>=':
        return lf >= rg;

      case '==':
        return lf == rg;

      case '!=':
        return lf != rg;

      case '&':
        return lf & rg;

      case '^':
        return lf ^ rg;

      case '|':
        return lf | rg;

      case '&&':
        return lf && rg;

      case '||':
        return lf || rg;

      case '??':
        return lf !== null && lf !== void 0 ? lf : rg;

      default:
        throw 'N/I';
    }
  }; // Check contant value and pure access


  Parser.checkNode = function (node) {
    if (node.R) Parser.checkNode(node.R);
    if (node.L) Parser.checkNode(node.L);
    if (node.C) Parser.checkNode(node.C);
    if (node.isConst) return;

    if (node.o.operands == 0) {
      if (node.t == 'number') {
        node.isConst = true;
        node.isPure = true;
        node.value = parseFloat(node.l);
        node.type = 'number';
      } else if (node.t == 'litteral') {
        node.isConst = true;
        node.isPure = true;
        node.value = Parser.stringFromLitteral(node.l);
        node.type = 'string';
      } else if (node.t == 'identifier') {
        node.isConst = false;
        node.isPure = true;
      } else {
        throw 'N/I';
      }
    } else if (node.o.operands == 1) {
      node.isConst = node.R.isConst;
      node.isPure = node.R.isPure;

      if (node.R.isConst) {
        node.value = Parser.computeBinaryOpcode(node.R.value, node.l);
        node.type = _typeof(node.value);
      }
    } else if (node.o.operands == 2) {
      if (node.R.isConst && node.L.isConst) {
        node.isConst = true;
        node.value = Parser.computeBinaryOpcode(node.L.value, node.l, node.R.value);
        node.type = _typeof(node.value);
      } else if (node.R.isPure && node.L.isPure) {
        node.isConst = false;
        node.isPure = true;
      } else {
        node.isConst = false;
        node.isPure = false;
      }
    } else if (node.o.operands == 3) {
      if (node.C.isConst) {
        node.isConst = node.C.value ? node.L.isConst : node.R.isConst;
        node.isPure = node.C.value ? node.L.isPure : node.R.isPure;

        if (node.isConst) {
          node.C.value ? node.L.value : node.R.value;
          node.C.type ? node.L.type : node.R.type;
        }
      } else if (node.C.isPure) {
        node.isConst = false;
        node.isPure = node.L.isPure && node.R.isPure;
      } else {
        node.isConst = false;
        node.isPure = true;
      }
    } else {
      throw 'N/I';
    }
  };

  Parser.exec = function (node, data) {
    if (node.isConst) return node;

    if (node.t == 'identifier') {
      if (data == null) {
        node.type = 'null';
        node.value = null;
      } else {
        node.value = data[node.l];
        node.type = node.value ? _typeof(node.value) : 'null';
      }

      return node;
    }

    switch (node.l) {
      case '.':
        Parser.exec(node.L, data);
        Parser.exec(node.R, node.L.value);
        node.type = node.R.type;
        node.value = node.R.value;
        break;

      case '?':
        Parser.exec(node.C, data);
        var N = node.C.value ? node.L : node.R;
        Parser.exec(N, data);
        node.type = N.type;
        node.value = N.value;
        break;

      default:
        if (node.o.operands == 1) node.value = Parser.computeUnaryOpcode(node.R.value, node.l);else if (node.o.operands == 2) node.value = Parser.computeBinaryOpcode(node.L.value, node.l, node.R.value);
        node.type = _typeof(node.value);
        break;
    }

    return node;
  };

  Parser.STATE_START = 0;
  Parser.STATE_OPERAND = 1;
  Parser.STATE_BINARY_OPERATOR = 2;
  Parser.STATE_UNARY_OPERATOR_LEFT_RIGHT = 3;
  Parser.STATE_UNARY_OPERATOR_RIGHT_LEFT = 4;
  Parser.STATE_ERROR = 5;
  Parser.STATE_CALL = 6;

  jaks.evalExpression = function (expr, data, debug) {
    // expr = expr.replace(/^\s+|\s+$/g, '');
    var lex = new Lexer(expr);
    var par = new Parser();

    if (debug === true) {
      lex.debug = true;
      par.debug = true;
    } // let toks = []


    for (;;) {
      var tk = lex.read();
      if (tk == null) break; // toks.push(tk)

      par.push(tk);
    }

    var val = par.resolve(data); // console.log('Expr', expr, '=>', val);

    return val ? val : '';
  };

  jaks.Lexer = Lexer;
  jaks.Parser = Parser;
  jaks.eval = jaks.evalExpression;
})(jaks, jQuery);