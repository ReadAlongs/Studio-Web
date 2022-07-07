!(function (t, n) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = n())
    : "function" == typeof define && define.amd
    ? define("soundswallower", [], n)
    : "object" == typeof exports
    ? (exports.soundswallower = n())
    : (t.soundswallower = n());
})(self, () =>
  (() => {
    var t = {
        668: (t) => {
          t.exports = function (t) {
            return atob(t);
          };
        },
        545: (t) => {
          "use strict";
          var n = {};
          t.exports = function (t) {
            if ("undefined" == typeof window) return null;
            var e =
                window.OfflineAudioContext || window.webkitOfflineAudioContext,
              r = window.AudioContext || window.webkitAudioContext;
            if (!r) return null;
            "number" == typeof t && (t = { sampleRate: t });
            var i = t && t.sampleRate;
            if (t && t.offline)
              return e ? new e(t.channels || 2, t.length, i || 44100) : null;
            var a = n[i];
            if (a) return a;
            try {
              a = new r(t);
            } catch (t) {
              a = new r();
            }
            return (n[a.sampleRate] = n[i] = a), a;
          };
        },
        433: (t, n, e) => {
          "use strict";
          const r = e(545),
            i = e(284);
          t.exports = function t(n, e, a) {
            e instanceof Function && ((a = e), (e = {})), e || (e = {});
            let s = e.context || r();
            return (
              n instanceof Blob && (n = new File([n], "decode")),
              n instanceof File
                ? new Promise((r, i) => {
                    try {
                      let i = new FileReader();
                      i.readAsArrayBuffer(n),
                        (i.onload = () => r(t(i.result, e, a)));
                    } catch (t) {
                      i(t);
                    }
                  })
                : (n instanceof ArrayBuffer || (n = i(n)),
                  s.decodeAudioData(
                    n.slice(),
                    (t) => {
                      a && a(null, t);
                    },
                    (t) => {
                      a && a(t);
                    }
                  ))
            );
          };
        },
        823: (t) => {
          t.exports = function (t) {
            switch (t) {
              case "int8":
                return Int8Array;
              case "int16":
                return Int16Array;
              case "int32":
                return Int32Array;
              case "uint8":
                return Uint8Array;
              case "uint16":
                return Uint16Array;
              case "uint32":
                return Uint32Array;
              case "float32":
                return Float32Array;
              case "float64":
                return Float64Array;
              case "array":
                return Array;
              case "uint8_clamped":
                return Uint8ClampedArray;
            }
          };
        },
        582: (t, n, e) => {
          var r = e(823);
          t.exports = function (t, n, e) {
            if (!t) throw new TypeError("must specify data as first parameter");
            if (
              ((e = 0 | +(e || 0)),
              Array.isArray(t) && t[0] && "number" == typeof t[0][0])
            ) {
              var i,
                a,
                s,
                o,
                l = t[0].length,
                _ = t.length * l;
              (n && "string" != typeof n) ||
                (n = new (r(n || "float32"))(_ + e));
              var f = n.length - e;
              if (_ !== f)
                throw new Error(
                  "source length " +
                    _ +
                    " (" +
                    l +
                    "x" +
                    t.length +
                    ") does not match destination length " +
                    f
                );
              for (i = 0, s = e; i < t.length; i++)
                for (a = 0; a < l; a++)
                  n[s++] = null === t[i][a] ? NaN : t[i][a];
            } else if (n && "string" != typeof n) n.set(t, e);
            else {
              var u = r(n || "float32");
              if (Array.isArray(t) || "array" === n)
                for (
                  i = 0, s = e, o = (n = new u(t.length + e)).length;
                  s < o;
                  s++, i++
                )
                  n[s] = null === t[i] ? NaN : t[i];
              else
                0 === e ? (n = new u(t)) : (n = new u(t.length + e)).set(t, e);
            }
            return n;
          };
        },
        648: function (t, n) {
          !(function (e) {
            "use strict";
            function r(t, n) {
              if (t instanceof Boolean || "boolean" == typeof t) return !1;
              if (
                (n instanceof Object || (n = {}),
                n.hasOwnProperty("allowBlank") && !n.allowBlank && "" === t)
              )
                return !1;
              var e =
                "(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+/]{3}=)?";
              return (
                n.mime && (e = "(data:\\w+\\/[a-zA-Z\\+\\-\\.]+;base64,)?" + e),
                !1 === n.paddingRequired &&
                  (e =
                    "(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}(==)?|[A-Za-z0-9+\\/]{3}=?)?"),
                new RegExp("^" + e + "$", "gi").test(t)
              );
            }
            t.exports && (n = t.exports = r), (n.isBase64 = r);
          })();
        },
        626: (t) => {
          t.exports = __dirname;
        },
        483: (t, n, e) => {
          var r,
            i =
              ((r =
                "undefined" != typeof document && document.currentScript
                  ? document.currentScript.src
                  : void 0),
              "undefined" != typeof __filename && (r = r || __filename),
              function (t) {
                var n, i;
                (t = void 0 !== (t = t || {}) ? t : {}).ready = new Promise(
                  function (t, e) {
                    (n = t), (i = e);
                  }
                );
                var a,
                  s,
                  o,
                  l,
                  _,
                  f,
                  u = Object.assign({}, t),
                  c = [],
                  p = "./this.program",
                  d = (t, n) => {
                    throw n;
                  },
                  m = "object" == typeof window,
                  g = "function" == typeof importScripts,
                  h = "";
                "object" == typeof process &&
                "object" == typeof process.versions &&
                "string" == typeof process.versions.node
                  ? ((h = g ? e(704).dirname(h) + "/" : __dirname + "/"),
                    (f = () => {
                      _ || ((l = e(255)), (_ = e(704)));
                    }),
                    (a = function (t, n) {
                      return (
                        f(),
                        (t = _.normalize(t)),
                        l.readFileSync(t, n ? void 0 : "utf8")
                      );
                    }),
                    (o = (t) => {
                      var n = a(t, !0);
                      return n.buffer || (n = new Uint8Array(n)), n;
                    }),
                    (s = (t, n, e) => {
                      f(),
                        (t = _.normalize(t)),
                        l.readFile(t, function (t, r) {
                          t ? e(t) : n(r.buffer);
                        });
                    }),
                    process.argv.length > 1 &&
                      (p = process.argv[1].replace(/\\/g, "/")),
                    (c = process.argv.slice(2)),
                    process.on("uncaughtException", function (t) {
                      if (!(t instanceof ut)) throw t;
                    }),
                    process.on("unhandledRejection", function (t) {
                      throw t;
                    }),
                    (d = (t, n) => {
                      if (L()) throw ((process.exitCode = t), n);
                      var e;
                      (e = n) instanceof ut ||
                        b("exiting due to exception: " + e),
                        process.exit(t);
                    }),
                    (t.inspect = function () {
                      return "[Emscripten Module object]";
                    }))
                  : (m || g) &&
                    (g
                      ? (h = self.location.href)
                      : "undefined" != typeof document &&
                        document.currentScript &&
                        (h = document.currentScript.src),
                    r && (h = r),
                    (h =
                      0 !== h.indexOf("blob:")
                        ? h.substr(
                            0,
                            h.replace(/[?#].*/, "").lastIndexOf("/") + 1
                          )
                        : ""),
                    (a = (t) => {
                      var n = new XMLHttpRequest();
                      return n.open("GET", t, !1), n.send(null), n.responseText;
                    }),
                    g &&
                      (o = (t) => {
                        var n = new XMLHttpRequest();
                        return (
                          n.open("GET", t, !1),
                          (n.responseType = "arraybuffer"),
                          n.send(null),
                          new Uint8Array(n.response)
                        );
                      }),
                    (s = (t, n, e) => {
                      var r = new XMLHttpRequest();
                      r.open("GET", t, !0),
                        (r.responseType = "arraybuffer"),
                        (r.onload = () => {
                          200 == r.status || (0 == r.status && r.response)
                            ? n(r.response)
                            : e();
                        }),
                        (r.onerror = e),
                        r.send(null);
                    }));
                var y,
                  w = t.print || console.log.bind(console),
                  b = t.printErr || console.warn.bind(console);
                Object.assign(t, u),
                  (u = null),
                  t.arguments && (c = t.arguments),
                  t.thisProgram && (p = t.thisProgram),
                  t.quit && (d = t.quit),
                  t.wasmBinary && (y = t.wasmBinary);
                var v,
                  A = t.noExitRuntime || !0;
                function E(t, n = "i8", e) {
                  switch (("*" === n.charAt(n.length - 1) && (n = "i32"), n)) {
                    case "i1":
                    case "i8":
                      return R[t >> 0];
                    case "i16":
                      return j[t >> 1];
                    case "i32":
                    case "i64":
                      return k[t >> 2];
                    case "float":
                      return C[t >> 2];
                    case "double":
                      return Number(U[t >> 3]);
                    default:
                      Y("invalid type for getValue: " + n);
                  }
                  return null;
                }
                "object" != typeof WebAssembly &&
                  Y("no native wasm support detected");
                var x = !1;
                function F(n, e, r, i, a) {
                  var s = {
                      string: function (t) {
                        var n = 0;
                        if (null != t && 0 !== t) {
                          var e = 1 + (t.length << 2);
                          !(function (t, n, e) {
                            B(t, S, n, e);
                          })(t, (n = ft(e)), e);
                        }
                        return n;
                      },
                      array: function (t) {
                        var n = ft(t.length);
                        return T(t, n), n;
                      },
                    },
                    o = (function (n) {
                      return t["_" + n];
                    })(n),
                    l = [],
                    _ = 0;
                  if (i)
                    for (var f = 0; f < i.length; f++) {
                      var u = s[r[f]];
                      u
                        ? (0 === _ && (_ = lt()), (l[f] = u(i[f])))
                        : (l[f] = i[f]);
                    }
                  var c = o.apply(null, l);
                  return (function (t) {
                    return (
                      0 !== _ && _t(_),
                      (function (t) {
                        return "string" === e
                          ? O(t)
                          : "boolean" === e
                          ? Boolean(t)
                          : t;
                      })(t)
                    );
                  })(c);
                }
                var z,
                  R,
                  S,
                  j,
                  k,
                  C,
                  U,
                  I =
                    "undefined" != typeof TextDecoder
                      ? new TextDecoder("utf8")
                      : void 0;
                function M(t, n, e) {
                  for (var r = n + e, i = n; t[i] && !(i >= r); ) ++i;
                  if (i - n > 16 && t.buffer && I)
                    return I.decode(t.subarray(n, i));
                  for (var a = ""; n < i; ) {
                    var s = t[n++];
                    if (128 & s) {
                      var o = 63 & t[n++];
                      if (192 != (224 & s)) {
                        var l = 63 & t[n++];
                        if (
                          (s =
                            224 == (240 & s)
                              ? ((15 & s) << 12) | (o << 6) | l
                              : ((7 & s) << 18) |
                                (o << 12) |
                                (l << 6) |
                                (63 & t[n++])) < 65536
                        )
                          a += String.fromCharCode(s);
                        else {
                          var _ = s - 65536;
                          a += String.fromCharCode(
                            55296 | (_ >> 10),
                            56320 | (1023 & _)
                          );
                        }
                      } else a += String.fromCharCode(((31 & s) << 6) | o);
                    } else a += String.fromCharCode(s);
                  }
                  return a;
                }
                function O(t, n) {
                  return t ? M(S, t, n) : "";
                }
                function B(t, n, e, r) {
                  if (!(r > 0)) return 0;
                  for (var i = e, a = e + r - 1, s = 0; s < t.length; ++s) {
                    var o = t.charCodeAt(s);
                    if (
                      (o >= 55296 &&
                        o <= 57343 &&
                        (o =
                          (65536 + ((1023 & o) << 10)) |
                          (1023 & t.charCodeAt(++s))),
                      o <= 127)
                    ) {
                      if (e >= a) break;
                      n[e++] = o;
                    } else if (o <= 2047) {
                      if (e + 1 >= a) break;
                      (n[e++] = 192 | (o >> 6)), (n[e++] = 128 | (63 & o));
                    } else if (o <= 65535) {
                      if (e + 2 >= a) break;
                      (n[e++] = 224 | (o >> 12)),
                        (n[e++] = 128 | ((o >> 6) & 63)),
                        (n[e++] = 128 | (63 & o));
                    } else {
                      if (e + 3 >= a) break;
                      (n[e++] = 240 | (o >> 18)),
                        (n[e++] = 128 | ((o >> 12) & 63)),
                        (n[e++] = 128 | ((o >> 6) & 63)),
                        (n[e++] = 128 | (63 & o));
                    }
                  }
                  return (n[e] = 0), e - i;
                }
                function P(t) {
                  var n =
                      (function (t) {
                        for (var n = 0, e = 0; e < t.length; ++e) {
                          var r = t.charCodeAt(e);
                          r >= 55296 &&
                            r <= 57343 &&
                            (r =
                              (65536 + ((1023 & r) << 10)) |
                              (1023 & t.charCodeAt(++e))),
                            r <= 127
                              ? ++n
                              : (n += r <= 2047 ? 2 : r <= 65535 ? 3 : 4);
                        }
                        return n;
                      })(t) + 1,
                    e = ft(n);
                  return B(t, R, e, n), e;
                }
                function T(t, n) {
                  R.set(t, n);
                }
                function D(n) {
                  (z = n),
                    (t.HEAP8 = R = new Int8Array(n)),
                    (t.HEAP16 = j = new Int16Array(n)),
                    (t.HEAP32 = k = new Int32Array(n)),
                    (t.HEAPU8 = S = new Uint8Array(n)),
                    (t.HEAPU16 = new Uint16Array(n)),
                    (t.HEAPU32 = new Uint32Array(n)),
                    (t.HEAPF32 = C = new Float32Array(n)),
                    (t.HEAPF64 = U = new Float64Array(n));
                }
                t.INITIAL_MEMORY;
                var G,
                  H = [],
                  N = [],
                  W = [];
                function L() {
                  return A;
                }
                var q,
                  Z,
                  J = 0,
                  V = null,
                  X = null;
                function Y(n) {
                  t.onAbort && t.onAbort(n),
                    b((n = "Aborted(" + n + ")")),
                    (x = !0),
                    (n += ". Build with -s ASSERTIONS=1 for more info.");
                  var e = new WebAssembly.RuntimeError(n);
                  throw (i(e), e);
                }
                function $(t) {
                  return t.startsWith("data:application/octet-stream;base64,");
                }
                function K(t) {
                  return t.startsWith("file://");
                }
                function Q(t) {
                  try {
                    if (t == q && y) return new Uint8Array(y);
                    if (o) return o(t);
                    throw "both async and sync fetching of the wasm failed";
                  } catch (t) {
                    Y(t);
                  }
                }
                function tt(n) {
                  for (; n.length > 0; ) {
                    var e = n.shift();
                    if ("function" != typeof e) {
                      var r = e.func;
                      "number" == typeof r
                        ? void 0 === e.arg
                          ? nt(r)()
                          : nt(r)(e.arg)
                        : r(void 0 === e.arg ? null : e.arg);
                    } else e(t);
                  }
                }
                function nt(t) {
                  return G.get(t);
                }
                (t.preloadedImages = {}),
                  (t.preloadedAudios = {}),
                  $((q = "assets/soundswallower.wasm")) ||
                    ((Z = q), (q = t.locateFile ? t.locateFile(Z, h) : h + Z));
                var et = {
                  buffers: [null, [], []],
                  printChar: function (t, n) {
                    var e = et.buffers[t];
                    0 === n || 10 === n
                      ? ((1 === t ? w : b)(M(e, 0)), (e.length = 0))
                      : e.push(n);
                  },
                  varargs: void 0,
                  get: function () {
                    return (et.varargs += 4), k[(et.varargs - 4) >> 2];
                  },
                  getStr: function (t) {
                    return O(t);
                  },
                  get64: function (t, n) {
                    return t;
                  },
                };
                function rt(t) {
                  try {
                    return (
                      v.grow((t - z.byteLength + 65535) >>> 16), D(v.buffer), 1
                    );
                  } catch (t) {}
                }
                var it = {};
                function at() {
                  if (!at.strings) {
                    var t = {
                      USER: "web_user",
                      LOGNAME: "web_user",
                      PATH: "/",
                      PWD: "/",
                      HOME: "/home/web_user",
                      LANG:
                        (
                          ("object" == typeof navigator &&
                            navigator.languages &&
                            navigator.languages[0]) ||
                          "C"
                        ).replace("-", "_") + ".UTF-8",
                      _: p || "./this.program",
                    };
                    for (var n in it)
                      void 0 === it[n] ? delete t[n] : (t[n] = it[n]);
                    var e = [];
                    for (var n in t) e.push(n + "=" + t[n]);
                    at.strings = e;
                  }
                  return at.strings;
                }
                var st,
                  ot = {
                    d: function (t, n, e) {
                      return (et.varargs = e), 0;
                    },
                    f: function (t, n) {},
                    h: function (t, n, e) {
                      return (et.varargs = e), 0;
                    },
                    r: function (t, n, e, r) {},
                    e: function (t, n, e, r) {
                      et.varargs = r;
                    },
                    s: function (t, n) {},
                    i: function () {
                      return Date.now();
                    },
                    k: function () {
                      throw 1 / 0;
                    },
                    n: function (t, n, e, r, i, a, s, o) {
                      return -52;
                    },
                    o: function (t, n, e, r, i, a) {},
                    t: function () {
                      Y("");
                    },
                    m: function () {
                      return 2147483648;
                    },
                    l: function (t) {
                      var n,
                        e = S.length,
                        r = 2147483648;
                      if ((t >>>= 0) > r) return !1;
                      for (var i = 1; i <= 4; i *= 2) {
                        var a = e * (1 + 0.2 / i);
                        if (
                          ((a = Math.min(a, t + 100663296)),
                          rt(
                            Math.min(
                              r,
                              (n = Math.max(t, a)) +
                                ((65536 - (n % 65536)) % 65536)
                            )
                          ))
                        )
                          return !0;
                      }
                      return !1;
                    },
                    p: function (t, n) {
                      var e = 0;
                      return (
                        at().forEach(function (r, i) {
                          var a = n + e;
                          (k[(t + 4 * i) >> 2] = a),
                            (function (t, n, e) {
                              for (var r = 0; r < t.length; ++r)
                                R[n++ >> 0] = t.charCodeAt(r);
                              R[n >> 0] = 0;
                            })(r, a),
                            (e += r.length + 1);
                        }),
                        0
                      );
                    },
                    q: function (t, n) {
                      var e = at();
                      k[t >> 2] = e.length;
                      var r = 0;
                      return (
                        e.forEach(function (t) {
                          r += t.length + 1;
                        }),
                        (k[n >> 2] = r),
                        0
                      );
                    },
                    a: function (n) {
                      !(function (n, e) {
                        var r;
                        (r = n),
                          L() || (t.onExit && t.onExit(r), (x = !0)),
                          d(r, new ut(r));
                      })(n);
                    },
                    b: function (t) {
                      return 0;
                    },
                    g: function (t, n, e, r) {
                      var i = et.getStreamFromFD(t),
                        a = et.doReadv(i, n, e);
                      return (k[r >> 2] = a), 0;
                    },
                    j: function (t, n, e, r, i) {},
                    c: function (t, n, e, r) {
                      for (var i = 0, a = 0; a < e; a++) {
                        var s = k[n >> 2],
                          o = k[(n + 4) >> 2];
                        n += 8;
                        for (var l = 0; l < o; l++) et.printChar(t, S[s + l]);
                        i += o;
                      }
                      return (k[r >> 2] = i), 0;
                    },
                  },
                  lt =
                    ((function () {
                      var n = { a: ot };
                      function e(n, e) {
                        var r,
                          i = n.exports;
                        (t.asm = i),
                          D((v = t.asm.u).buffer),
                          (G = t.asm.G),
                          (r = t.asm.v),
                          N.unshift(r),
                          (function (n) {
                            if (
                              (J--,
                              t.monitorRunDependencies &&
                                t.monitorRunDependencies(J),
                              0 == J &&
                                (null !== V && (clearInterval(V), (V = null)),
                                X))
                            ) {
                              var e = X;
                              (X = null), e();
                            }
                          })();
                      }
                      function r(t) {
                        e(t.instance);
                      }
                      function a(t) {
                        return (function () {
                          if (!y && (m || g)) {
                            if ("function" == typeof fetch && !K(q))
                              return fetch(q, { credentials: "same-origin" })
                                .then(function (t) {
                                  if (!t.ok)
                                    throw (
                                      "failed to load wasm binary file at '" +
                                      q +
                                      "'"
                                    );
                                  return t.arrayBuffer();
                                })
                                .catch(function () {
                                  return Q(q);
                                });
                            if (s)
                              return new Promise(function (t, n) {
                                s(
                                  q,
                                  function (n) {
                                    t(new Uint8Array(n));
                                  },
                                  n
                                );
                              });
                          }
                          return Promise.resolve().then(function () {
                            return Q(q);
                          });
                        })()
                          .then(function (t) {
                            return WebAssembly.instantiate(t, n);
                          })
                          .then(function (t) {
                            return t;
                          })
                          .then(t, function (t) {
                            b("failed to asynchronously prepare wasm: " + t),
                              Y(t);
                          });
                      }
                      if (
                        (J++,
                        t.monitorRunDependencies && t.monitorRunDependencies(J),
                        t.instantiateWasm)
                      )
                        try {
                          return t.instantiateWasm(n, e);
                        } catch (t) {
                          return (
                            b(
                              "Module.instantiateWasm callback failed with error: " +
                                t
                            ),
                            !1
                          );
                        }
                      (y ||
                      "function" != typeof WebAssembly.instantiateStreaming ||
                      $(q) ||
                      K(q) ||
                      "function" != typeof fetch
                        ? a(r)
                        : fetch(q, { credentials: "same-origin" }).then(
                            function (t) {
                              return WebAssembly.instantiateStreaming(
                                t,
                                n
                              ).then(r, function (t) {
                                return (
                                  b("wasm streaming compile failed: " + t),
                                  b(
                                    "falling back to ArrayBuffer instantiation"
                                  ),
                                  a(r)
                                );
                              });
                            }
                          )
                      ).catch(i);
                    })(),
                    (t.___wasm_call_ctors = function () {
                      return (t.___wasm_call_ctors = t.asm.v).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_set_states = function () {
                      return (t._fsg_set_states = t.asm.w).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_hash_iter = function () {
                      return (t._cmd_ln_hash_iter = t.asm.x).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._hash_iter_key = function () {
                      return (t._hash_iter_key = t.asm.y).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._set_mdef = function () {
                      return (t._set_mdef = t.asm.z).apply(null, arguments);
                    }),
                    (t._set_tmat = function () {
                      return (t._set_tmat = t.asm.A).apply(null, arguments);
                    }),
                    (t._load_gmm = function () {
                      return (t._load_gmm = t.asm.B).apply(null, arguments);
                    }),
                    (t._ptm_mgau_init_s3file = function () {
                      return (t._ptm_mgau_init_s3file = t.asm.C).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._s3file_rewind = function () {
                      return (t._s3file_rewind = t.asm.D).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._s2_semi_mgau_init_s3file = function () {
                      return (t._s2_semi_mgau_init_s3file = t.asm.E).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ms_mgau_init_s3file = function () {
                      return (t._ms_mgau_init_s3file = t.asm.F).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_str_r = function () {
                      return (t._cmd_ln_str_r = t.asm.H).apply(null, arguments);
                    }),
                    (t._cmd_ln_float_r = function () {
                      return (t._cmd_ln_float_r = t.asm.I).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_int_r = function () {
                      return (t._cmd_ln_int_r = t.asm.J).apply(null, arguments);
                    }),
                    (t._cmd_ln_retain = function () {
                      return (t._cmd_ln_retain = t.asm.K).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._logmath_retain = function () {
                      return (t._logmath_retain = t.asm.L).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_free_r = function () {
                      return (t._cmd_ln_free_r = t.asm.M).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._logmath_free = function () {
                      return (t._logmath_free = t.asm.N).apply(null, arguments);
                    }),
                    (t._s3file_free = function () {
                      return (t._s3file_free = t.asm.O).apply(null, arguments);
                    }),
                    (t._bin_mdef_read_s3file = function () {
                      return (t._bin_mdef_read_s3file = t.asm.P).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._malloc = function () {
                      return (t._malloc = t.asm.Q).apply(null, arguments);
                    }),
                    (t._free = function () {
                      return (t._free = t.asm.R).apply(null, arguments);
                    }),
                    (t._cmd_ln_parse_r = function () {
                      return (t._cmd_ln_parse_r = t.asm.S).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_init = function () {
                      return (t._cmd_ln_init = t.asm.T).apply(null, arguments);
                    }),
                    (t._cmd_ln_exists_r = function () {
                      return (t._cmd_ln_exists_r = t.asm.U).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_type_r = function () {
                      return (t._cmd_ln_type_r = t.asm.V).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_set_str_r = function () {
                      return (t._cmd_ln_set_str_r = t.asm.W).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_set_int_r = function () {
                      return (t._cmd_ln_set_int_r = t.asm.X).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._cmd_ln_set_float_r = function () {
                      return (t._cmd_ln_set_float_r = t.asm.Y).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_trans_add = function () {
                      return (t._fsg_model_trans_add = t.asm.Z).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_tag_trans_add = function () {
                      return (t._fsg_model_tag_trans_add = t.asm._).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_null_trans_add = function () {
                      return (t._fsg_model_null_trans_add = t.asm.$).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._hash_table_iter_next = function () {
                      return (t._hash_table_iter_next = t.asm.aa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_word_id = function () {
                      return (t._fsg_model_word_id = t.asm.ba).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_word_add = function () {
                      return (t._fsg_model_word_add = t.asm.ca).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._logmath_log = function () {
                      return (t._logmath_log = t.asm.da).apply(null, arguments);
                    }),
                    (t._fsg_model_init = function () {
                      return (t._fsg_model_init = t.asm.ea).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_free = function () {
                      return (t._fsg_model_free = t.asm.fa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._fsg_model_retain = function () {
                      return (t._fsg_model_retain = t.asm.ga).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._logmath_exp = function () {
                      return (t._logmath_exp = t.asm.ha).apply(null, arguments);
                    }),
                    (t._jsgf_grammar_free = function () {
                      return (t._jsgf_grammar_free = t.asm.ia).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._jsgf_get_rule = function () {
                      return (t._jsgf_get_rule = t.asm.ja).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._jsgf_get_public_rule = function () {
                      return (t._jsgf_get_public_rule = t.asm.ka).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._jsgf_build_fsg = function () {
                      return (t._jsgf_build_fsg = t.asm.la).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._jsgf_parse_string = function () {
                      return (t._jsgf_parse_string = t.asm.ma).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._logmath_init = function () {
                      return (t._logmath_init = t.asm.na).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init_config = function () {
                      return (t._ps_init_config = t.asm.oa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_args = function () {
                      return (t._ps_args = t.asm.pa).apply(null, arguments);
                    }),
                    (t._ps_init_cleanup = function () {
                      return (t._ps_init_cleanup = t.asm.qa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init_fe = function () {
                      return (t._ps_init_fe = t.asm.ra).apply(null, arguments);
                    }),
                    (t._ps_init_feat_s3file = function () {
                      return (t._ps_init_feat_s3file = t.asm.sa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init_acmod_pre = function () {
                      return (t._ps_init_acmod_pre = t.asm.ta).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init_acmod_post = function () {
                      return (t._ps_init_acmod_post = t.asm.ua).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init_dict_s3file = function () {
                      return (t._ps_init_dict_s3file = t.asm.va).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_set_fsg = function () {
                      return (t._ps_set_fsg = t.asm.wa).apply(null, arguments);
                    }),
                    (t._ps_init_grammar_s3file = function () {
                      return (t._ps_init_grammar_s3file = t.asm.xa).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_set_jsgf_string = function () {
                      return (t._ps_set_jsgf_string = t.asm.ya).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_reinit_fe = function () {
                      return (t._ps_reinit_fe = t.asm.za).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_init = function () {
                      return (t._ps_init = t.asm.Aa).apply(null, arguments);
                    }),
                    (t._ps_retain = function () {
                      return (t._ps_retain = t.asm.Ba).apply(null, arguments);
                    }),
                    (t._ps_free = function () {
                      return (t._ps_free = t.asm.Ca).apply(null, arguments);
                    }),
                    (t._ps_get_config = function () {
                      return (t._ps_get_config = t.asm.Da).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_get_logmath = function () {
                      return (t._ps_get_logmath = t.asm.Ea).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_add_word = function () {
                      return (t._ps_add_word = t.asm.Fa).apply(null, arguments);
                    }),
                    (t._ps_lookup_word = function () {
                      return (t._ps_lookup_word = t.asm.Ga).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_start_utt = function () {
                      return (t._ps_start_utt = t.asm.Ha).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_process_float32 = function () {
                      return (t._ps_process_float32 = t.asm.Ia).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_end_utt = function () {
                      return (t._ps_end_utt = t.asm.Ja).apply(null, arguments);
                    }),
                    (t._ps_get_hyp = function () {
                      return (t._ps_get_hyp = t.asm.Ka).apply(null, arguments);
                    }),
                    (t._ps_seg_iter = function () {
                      return (t._ps_seg_iter = t.asm.La).apply(null, arguments);
                    }),
                    (t._ps_seg_word = function () {
                      return (t._ps_seg_word = t.asm.Ma).apply(null, arguments);
                    }),
                    (t._ps_seg_frames = function () {
                      return (t._ps_seg_frames = t.asm.Na).apply(
                        null,
                        arguments
                      );
                    }),
                    (t._ps_seg_prob = function () {
                      return (t._ps_seg_prob = t.asm.Oa).apply(null, arguments);
                    }),
                    (t._ps_seg_next = function () {
                      return (t._ps_seg_next = t.asm.Pa).apply(null, arguments);
                    }),
                    (t._ps_get_prob = function () {
                      return (t._ps_get_prob = t.asm.Qa).apply(null, arguments);
                    }),
                    (t._ps_seg_free = function () {
                      return (t._ps_seg_free = t.asm.Ra).apply(null, arguments);
                    }),
                    (t._s3file_init = function () {
                      return (t._s3file_init = t.asm.Sa).apply(null, arguments);
                    }),
                    (t._tmat_init_s3file = function () {
                      return (t._tmat_init_s3file = t.asm.Ta).apply(
                        null,
                        arguments
                      );
                    }),
                    (t.stackSave = function () {
                      return (lt = t.stackSave = t.asm.Ua).apply(
                        null,
                        arguments
                      );
                    })),
                  _t = (t.stackRestore = function () {
                    return (_t = t.stackRestore = t.asm.Va).apply(
                      null,
                      arguments
                    );
                  }),
                  ft = (t.stackAlloc = function () {
                    return (ft = t.stackAlloc = t.asm.Wa).apply(
                      null,
                      arguments
                    );
                  });
                function ut(t) {
                  (this.name = "ExitStatus"),
                    (this.message = "Program terminated with exit(" + t + ")"),
                    (this.status = t);
                }
                function ct(e) {
                  function r() {
                    st ||
                      ((st = !0),
                      (t.calledRun = !0),
                      x ||
                        (tt(N),
                        n(t),
                        t.onRuntimeInitialized && t.onRuntimeInitialized(),
                        (function () {
                          if (t.postRun)
                            for (
                              "function" == typeof t.postRun &&
                              (t.postRun = [t.postRun]);
                              t.postRun.length;

                            )
                              (n = t.postRun.shift()), W.unshift(n);
                          var n;
                          tt(W);
                        })()));
                  }
                  (e = e || c),
                    J > 0 ||
                      ((function () {
                        if (t.preRun)
                          for (
                            "function" == typeof t.preRun &&
                            (t.preRun = [t.preRun]);
                            t.preRun.length;

                          )
                            (n = t.preRun.shift()), H.unshift(n);
                        var n;
                        tt(H);
                      })(),
                      J > 0 ||
                        (t.setStatus
                          ? (t.setStatus("Running..."),
                            setTimeout(function () {
                              setTimeout(function () {
                                t.setStatus("");
                              }, 1),
                                r();
                            }, 1))
                          : r()));
                }
                if (
                  ((X = function t() {
                    st || ct(), st || (X = t);
                  }),
                  (t.run = ct),
                  t.preInit)
                )
                  for (
                    "function" == typeof t.preInit && (t.preInit = [t.preInit]);
                    t.preInit.length > 0;

                  )
                    t.preInit.pop()();
                ct(),
                  void 0 === t.defaultModel && (t.defaultModel = "en-us"),
                  void 0 === t.modelBase &&
                    (t.modelBase = m ? "model/" : e(626));
                class pt {
                  constructor(n) {
                    if (
                      ((this.cmd_ln = t._cmd_ln_parse_r(
                        0,
                        t._ps_args(),
                        0,
                        0,
                        0
                      )),
                      void 0 === n)
                    ) {
                      if (null === t.defaultModel) return;
                      n = { hmm: t.get_model_path(t.defaultModel) };
                    } else
                      null !== t.defaultModel &&
                        ("hmm" in n ||
                          (n.hmm = t.get_model_path(t.defaultModel)));
                    for (const t in n) this.set(t, n[t]);
                  }
                  delete() {
                    this.cmd_ln && t._cmd_ln_free_r(this.cmd_ln),
                      (this.cmd_ln = 0);
                  }
                  normalize_key(t) {
                    if (t.length > 0) {
                      if ("_" == t[0]) return t;
                      if ("-" == t[0]) {
                        const n = "_" + t.substr(1);
                        return this.has(n) ? n : t;
                      }
                      {
                        const n = "_" + t;
                        if (this.has(n)) return n;
                        const e = "-" + t;
                        return this.has(e) ? e : t;
                      }
                    }
                    return "";
                  }
                  normalize_ckey(t) {
                    const n = O(t);
                    return 0 == n.length
                      ? n
                      : "-" == n[0] || "_" == n[0]
                      ? n.substr(1)
                      : n;
                  }
                  set(n, e) {
                    const r = P(this.normalize_key(n)),
                      i = t._cmd_ln_type_r(this.cmd_ln, r);
                    if (0 == i)
                      throw new ReferenceError("Unknown cmd_ln parameter " + n);
                    if (8 & i) {
                      const n = P(e);
                      t._cmd_ln_set_str_r(this.cmd_ln, r, n);
                    } else if (4 & i) t._cmd_ln_set_float_r(this.cmd_ln, r, e);
                    else {
                      if (!(18 & i)) return !1;
                      t._cmd_ln_set_int_r(this.cmd_ln, r, e);
                    }
                    return !0;
                  }
                  get(n) {
                    const e = P(this.normalize_key(n)),
                      r = t._cmd_ln_type_r(this.cmd_ln, e);
                    if (0 == r)
                      throw new ReferenceError("Unknown cmd_ln parameter " + n);
                    if (8 & r) {
                      const n = t._cmd_ln_str_r(this.cmd_ln, e);
                      return 0 == n ? null : O(n);
                    }
                    if (4 & r) return t._cmd_ln_float_r(this.cmd_ln, e);
                    if (2 & r) return t._cmd_ln_int_r(this.cmd_ln, e);
                    if (16 & r) return Boolean(t._cmd_ln_int_r(this.cmd_ln, e));
                    throw new TypeError(
                      "Unsupported type " + r + " for parameter" + n
                    );
                  }
                  model_file_path(t, n) {
                    const e = this.get(t);
                    if (null != e) return e;
                    const r = this.get("hmm");
                    if (null == r)
                      throw new Error(
                        "Could not get " + t + " from config or model directory"
                      );
                    return r + "/" + n;
                  }
                  has(n) {
                    const e = P(n);
                    return t._cmd_ln_exists_r(this.cmd_ln, e);
                  }
                  *[Symbol.iterator]() {
                    let n = t._cmd_ln_hash_iter(this.cmd_ln);
                    const e = new Set();
                    for (; 0 != n; ) {
                      const r = t._hash_iter_key(n),
                        i = this.normalize_ckey(r);
                      e.has(i) ||
                        (e.add(i), (n = t._hash_table_iter_next(n)), yield i);
                    }
                  }
                }
                async function dt(n) {
                  let r;
                  if (m) {
                    const t = await fetch(n);
                    if (!t.ok)
                      throw new Error(
                        "Failed to fetch " + n + " :" + t.statusText
                      );
                    {
                      const n = await t.blob(),
                        e = await n.arrayBuffer();
                      r = new Uint8Array(e);
                    }
                  } else {
                    const t = e(512),
                      i = await t.readFile(n);
                    r = new Uint8Array(i.buffer);
                  }
                  const i = r.length + 1,
                    a = t._malloc(i);
                  if (0 == a)
                    throw new Error(
                      "Failed to allocate " + i + " bytes for " + n
                    );
                  return T(r, a), (R[a + i] = 0), t._s3file_init(a, i - 1);
                }
                return (
                  (t.get_model_path = function (n) {
                    return m ? t.modelBase + n : e(704).join(t.modelBase, n);
                  }),
                  (t.Config = pt),
                  (t.Decoder = class {
                    constructor(n) {
                      if (
                        ((this.config =
                          n && "object" == typeof n && "cmd_ln" in n
                            ? n
                            : new t.Config(...arguments)),
                        (this.initialized = !1),
                        (this.ps = t._ps_init(0)),
                        0 == this.ps)
                      )
                        throw new Error("Failed to construct Decoder");
                    }
                    async initialize(n) {
                      if (0 == this.ps)
                        throw new Error(
                          "Decoder was somehow not constructed (ps==0)"
                        );
                      void 0 !== n &&
                        (this.config && this.config.delete(),
                        (this.config =
                          "object" == typeof n && "cmd_ln" in n
                            ? n
                            : new t.Config(...arguments))),
                        await this.init_config(),
                        await this.init_fe(),
                        await this.init_feat(),
                        await this.init_acmod(),
                        await this.load_acmod_files(),
                        await this.init_dict(),
                        await this.init_grammar(),
                        (this.initialized = !0);
                    }
                    async init_config() {
                      await this.init_featparams();
                      let n = t._ps_init_config(this.ps, this.config.cmd_ln);
                      if (n < 0)
                        throw new Error(
                          "Failed to initialize basic configuration"
                        );
                      if (((n = t._ps_init_cleanup(this.ps)), n < 0))
                        throw new Error("Failed to clean up decoder internals");
                    }
                    async init_featparams() {
                      const t = this.config.model_file_path(
                        "featparams",
                        "feat.params"
                      );
                      for await (const n of (async function* (t) {
                        let n;
                        if (m) {
                          const e = await fetch(t);
                          if (!e.ok)
                            throw new Error(
                              "Failed to fetch " + t + " :" + e.statusText
                            );
                          n = await e.text();
                        } else {
                          const r = e(512);
                          n = await r.readFile(t, { encoding: "utf8" });
                        }
                        const r = /^.*$/gm,
                          i = /"([^"]*)"|'([^'])'|(\S+)/g;
                        let a = null;
                        for (const t of n.matchAll(r)) {
                          const n = t[0].trim();
                          for (const t of n.matchAll(i)) {
                            const n = t[1] ?? t[2] ?? t[3];
                            if ("#" == n) break;
                            null !== a ? (yield [a, n], (a = null)) : (a = n);
                          }
                        }
                        if (null !== a)
                          throw new Error("Odd number of arguments in " + t);
                      })(t))
                        this.config.has(n[0]) && this.config.set(n[0], n[1]);
                    }
                    async init_fe() {
                      if (0 == t._ps_init_fe(this.ps))
                        throw new Error("Failed to initialize frontend");
                    }
                    async init_feat() {
                      let n;
                      try {
                        const e = this.config.model_file_path(
                            "lda",
                            "feature_transform"
                          ),
                          r = await dt(e);
                        n = t._ps_init_feat_s3file(this.ps, r);
                      } catch (e) {
                        n = t._ps_init_feat_s3file(this.ps, 0);
                      }
                      if (0 == n)
                        throw new Error("Failed to initialize feature module");
                    }
                    async init_acmod() {
                      if (0 == t._ps_init_acmod_pre(this.ps))
                        throw new Error("Failed to initialize acoustic model");
                    }
                    async load_acmod_files() {
                      await this.load_mdef();
                      const n = this.config.model_file_path(
                        "tmat",
                        "transition_matrices"
                      );
                      await this.load_tmat(n);
                      const e = this.config.model_file_path("mean", "means"),
                        r = this.config.model_file_path("var", "variances"),
                        i = this.config.model_file_path("sendump", "sendump"),
                        a = this.config.model_file_path(
                          "mixw",
                          "mixture_weights"
                        );
                      if (
                        (await this.load_gmm(e, r, i, a),
                        t._ps_init_acmod_post(this.ps) < 0)
                      )
                        throw new Error(
                          "Failed to initialize acoustic scoring"
                        );
                    }
                    async load_mdef() {
                      var n, e;
                      try {
                        (n = this.config.model_file_path("mdef", "mdef.bin")),
                          (e = await dt(n));
                      } catch (t) {
                        try {
                          (n = this.config.model_file_path("mdef", "mdef.txt")),
                            (e = await dt(n));
                        } catch (t) {
                          (n = this.config.model_file_path("mdef", "mdef")),
                            (e = await dt(n));
                        }
                      }
                      const r = t._bin_mdef_read_s3file(e, 0);
                      if ((t._s3file_free(e), 0 == r))
                        throw new Error("Failed to read mdef");
                      t._set_mdef(this.ps, r);
                    }
                    async load_tmat(n) {
                      const e = await dt(n),
                        r = t._ps_get_logmath(this.ps),
                        i = this.config.get("tmatfloor"),
                        a = t._tmat_init_s3file(e, r, i);
                      if ((t._s3file_free(e), 0 == a))
                        throw new Error("Failed to read tmat");
                      t._set_tmat(this.ps, a);
                    }
                    async load_gmm(n, e, r, i) {
                      const a = await dt(n),
                        s = await dt(e);
                      var o, l;
                      try {
                        (o = await dt(r)), (l = 0);
                      } catch (t) {
                        (o = 0), (l = await dt(i));
                      }
                      if (t._load_gmm(this.ps, a, s, l, o) < 0)
                        throw new Error("Failed to load GMM parameters");
                    }
                    async init_dict() {
                      const n = this.config.model_file_path("dict", "dict.txt"),
                        e = await dt(n);
                      let r;
                      try {
                        const t = this.config.model_file_path(
                          "fdict",
                          "noisedict"
                        );
                        r = await dt(t);
                      } catch (t) {
                        r = 0;
                      }
                      if (0 == t._ps_init_dict_s3file(this.ps, e, r))
                        throw new Error("Failed to initialize dictionaries");
                    }
                    async init_grammar() {
                      let n = 0,
                        e = 0;
                      const r = this.config.get("jsgf");
                      null != r && (e = await dt(r));
                      const i = this.config.get("fsg");
                      if (
                        (null != i && (n = await dt(i)),
                        (n || e) &&
                          t._ps_init_grammar_s3file(this.ps, n, e) < 0)
                      )
                        throw new Error("Failed to initialize grammar");
                    }
                    assert_initialized() {
                      if (!this.initialized)
                        throw new Error("Decoder not yet initialized");
                    }
                    async reinitialize_audio() {
                      this.assert_initialized(), t._ps_reinit_fe(this.ps, 0);
                    }
                    delete() {
                      this.config && this.config.delete(),
                        this.ps && t._ps_free(this.ps),
                        (this.ps = 0);
                    }
                    async start() {
                      if (
                        (this.assert_initialized(),
                        t._ps_start_utt(this.ps) < 0)
                      )
                        throw new Error("Failed to start utterance processing");
                    }
                    async stop() {
                      if (
                        (this.assert_initialized(), t._ps_end_utt(this.ps) < 0)
                      )
                        throw new Error("Failed to stop utterance processing");
                    }
                    async process(n, e = !1, r = !1) {
                      this.assert_initialized();
                      const i = n.length * n.BYTES_PER_ELEMENT,
                        a = t._malloc(i);
                      T(new Uint8Array(n.buffer), a);
                      const s = t._ps_process_float32(this.ps, a, i / 4, e, r);
                      if ((t._free(a), s < 0))
                        throw new Error("Utterance processing failed");
                      return s;
                    }
                    get_hyp() {
                      return (
                        this.assert_initialized(), O(t._ps_get_hyp(this.ps, 0))
                      );
                    }
                    get_hypseg() {
                      this.assert_initialized();
                      let n = t._ps_seg_iter(this.ps);
                      const e = t._ps_get_config(this.ps),
                        r = t._cmd_ln_int_r(e, P("-frate")),
                        i = [];
                      for (; 0 != n; ) {
                        const e = ft(8);
                        t._ps_seg_frames(n, e, e + 4);
                        const a = E(e, "i32"),
                          s = E(e + 4, "i32"),
                          o = {
                            word: F("ps_seg_word", "string", ["number"], [n]),
                            start: a / r,
                            end: s / r,
                          };
                        i.push(o), (n = t._ps_seg_next(n));
                      }
                      return i;
                    }
                    lookup_word(n) {
                      this.assert_initialized();
                      const e = P(n),
                        r = t._ps_lookup_word(this.ps, e);
                      return 0 == r ? null : O(r);
                    }
                    async add_word(n, e, r = !0) {
                      this.assert_initialized();
                      const i = P(n),
                        a = P(e),
                        s = t._ps_add_word(this.ps, i, a, r);
                      if (s < 0)
                        throw new Error(
                          "Failed to add word " +
                            n +
                            " with pronunciation " +
                            e +
                            " to the dictionary."
                        );
                      return s;
                    }
                    create_fsg(n, e, r, i) {
                      this.assert_initialized();
                      const a = t._ps_get_logmath(this.ps),
                        s = t._ps_get_config(this.ps),
                        o = t._cmd_ln_float_r(s, P("-lw"));
                      let l = 0;
                      for (const t of i) l = Math.max(l, t.from, t.to);
                      l++;
                      const _ = F(
                        "fsg_model_init",
                        "number",
                        ["string", "number", "number", "number"],
                        [n, a, o, l]
                      );
                      t._fsg_set_states(_, e, r);
                      for (const n of i) {
                        let e = 0;
                        if (
                          ("prob" in n && (e = t._logmath_log(a, n.prob)),
                          "word" in n)
                        ) {
                          const r = F(
                            "fsg_model_word_add",
                            "number",
                            ["number", "string"],
                            [_, n.word]
                          );
                          if (-1 == r) return t._fsg_model_free(_), 0;
                          t._fsg_model_trans_add(_, n.from, n.to, e, r);
                        } else t._fsg_model_null_trans_add(_, n.from, n.to, e);
                      }
                      return {
                        fsg: _,
                        delete() {
                          t._fsg_model_free(this.fsg), (this.fsg = 0);
                        },
                      };
                    }
                    parse_jsgf(n, e = null) {
                      this.assert_initialized();
                      const r = t._ps_get_logmath(this.ps),
                        i = t._ps_get_config(this.ps),
                        a = t._cmd_ln_float_r(i, P("-lw")),
                        s = P(n),
                        o = t._jsgf_parse_string(s, 0);
                      if (0 == o) throw new Error("Failed to parse JSGF");
                      let l;
                      if (null !== e) {
                        const n = P(e);
                        if (((l = t._jsgf_get_rule(o, n)), 0 == l))
                          throw new Error("Failed to find top rule " + e);
                      } else if (((l = t._jsgf_get_public_rule(o)), 0 == l))
                        throw new Error("No public rules found in JSGF");
                      const _ = t._jsgf_build_fsg(o, l, r, a);
                      return (
                        t._jsgf_grammar_free(o),
                        {
                          fsg: _,
                          delete() {
                            t._fsg_model_free(this.fsg), (this.fsg = 0);
                          },
                        }
                      );
                    }
                    async set_fsg(n) {
                      if (
                        (this.assert_initialized(),
                        0 != t._ps_set_fsg(this.ps, "_default", n.fsg))
                      )
                        throw new Error("Failed to set FSG in decoder");
                    }
                  }),
                  t.ready
                );
              });
          t.exports = i;
        },
        634: (t, n, e) => {
          "use strict";
          var r = e(668),
            i = e(648);
          function a(t) {
            for (var n = new Uint8Array(t.length), e = 0; e < t.length; e++)
              n[e] = t.charCodeAt(e);
            return n.buffer;
          }
          t.exports = function (t) {
            if ("string" != typeof t)
              throw Error("Argument should be a string");
            return /^data\:/i.test(t)
              ? (function (t) {
                  var n = (t = t.replace(/\r?\n/g, "")).indexOf(",");
                  if (-1 === n || n <= 4)
                    throw new TypeError("malformed data-URI");
                  for (
                    var e = t.substring(5, n).split(";"),
                      i = !1,
                      s = "US-ASCII",
                      o = 0;
                    o < e.length;
                    o++
                  )
                    "base64" == e[o]
                      ? (i = !0)
                      : 0 == e[o].indexOf("charset=") &&
                        (s = e[o].substring(8));
                  var l = unescape(t.substring(n + 1));
                  i && (l = r(l));
                  var _ = a(l);
                  return (_.type = e[0] || "text/plain"), (_.charset = s), _;
                })(t)
              : (i(t) && (t = r(t)), a(t));
          };
        },
        284: (t, n, e) => {
          "use strict";
          var r = e(634),
            i = e(582);
          t.exports = function t(n) {
            if (!n) return new ArrayBuffer();
            if (n instanceof ArrayBuffer) return n;
            if ("string" == typeof n) return r(n);
            if (ArrayBuffer.isView(n))
              return null != n.byteOffset
                ? n.buffer.slice(n.byteOffset, n.byteOffset + n.byteLength)
                : n.buffer;
            if (n.buffer || n.data || n._data)
              return t(n.buffer || n.data || n._data);
            if (null != n.length)
              for (var e = 0; e < n.length; e++)
                if (null != n[e].length) {
                  n = i(n);
                  break;
                }
            return new Uint8Array(null != n.length ? n : [n]).buffer;
          };
        },
        364: (t, n, e) => {
          "use strict";
          var r,
            i = null;
          t.exports = {
            initialize: async function (t) {
              return (r = await e(483)()), (i = new r.Decoder(t)).initialize();
            },
            align: async function (t, n) {
              i.config.get("samprate") != t.sampleRate &&
                (i.config.set("samprate", t.sampleRate),
                await i.reinitialize_audio()),
                console.log(i.config.get("samprate")),
                console.log(t.sampleRate),
                await i.start(),
                await i.process(t.getChannelData(0), !1, !0),
                await i.stop();
              let e = i.get_hypseg();
              return console.log(e), e;
            },
            addDict: async function (t) {
              let n = t.length;
              Object.keys(t).map(async (e, r) => {
                console.log(
                  "adding dictionary entry for " + e + " equal to " + t[e]
                ),
                  await i.add_word(e, t[e], r === n - 1);
              }),
                console.log("finished adding words");
            },
            createGrammarFromJSGF: async function (t) {
              const n = i.parse_jsgf(t);
              await i.set_fsg(n),
                n.delete(),
                console.log("finished creating grammar");
            },
          };
        },
        255: () => {},
        512: () => {},
        704: () => {},
      },
      n = {};
    function e(r) {
      var i = n[r];
      if (void 0 !== i) return i.exports;
      var a = (n[r] = { exports: {} });
      return t[r].call(a.exports, a, a.exports, e), a.exports;
    }
    (e.d = (t, n) => {
      for (var r in n)
        e.o(n, r) &&
          !e.o(t, r) &&
          Object.defineProperty(t, r, { enumerable: !0, get: n[r] });
    }),
      (e.o = (t, n) => Object.prototype.hasOwnProperty.call(t, n)),
      (e.r = (t) => {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(t, "__esModule", { value: !0 });
      });
    var r = {};
    return (
      (() => {
        "use strict";
        e.r(r),
          e.d(r, {
            align: () => o,
            aligner: () => n,
            aligner_ready: () => i,
            createFSG: () => s,
            decode: () => t,
            initialize: () => a,
          });
        var t = e(433),
          n = e(364);
        let i = !1;
        async function a(t) {
          try {
            const e = await n.initialize(t);
            return console.log("Speech recognition ready"), (i = !0), e;
          } catch (t) {
            console.log("Error initializing speech aligner: " + t.message);
          }
        }
        async function s(t, e) {
          try {
            await n.addDict(e), console.log("Added words to dictionary");
          } catch (t) {
            return (
              console.log("Error adding words to dictionary: " + t.message), !1
            );
          }
          try {
            await n.createGrammarFromJSGF(t), console.log("Added grammar");
          } catch (t) {
            return console.log("Error adding grammar: " + t.message), !1;
          }
          console.log("Grammar ready.");
        }
        async function o(t, e) {
          try {
            let r = await n.align(t, e);
            return console.log("Recognition finished"), r;
          } catch (t) {
            console.log("Error performing recognition: " + t.message);
          }
        }
      })(),
      r
    );
  })()
);
