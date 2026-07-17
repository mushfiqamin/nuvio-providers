/**
 * bdix - Built from src/bdix/
 * Generated: 2026-07-17T01:14:53.134Z
 */
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/bdix/http.js
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
  "Content-Type": "application/json"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(url, __spreadValues({
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
    }, options));
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return yield response.text();
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const raw = yield fetchText(url, options);
    return JSON.parse(raw);
  });
}
function postJson(_0, _1) {
  return __async(this, arguments, function* (url, data, options = {}) {
    const response = yield fetch(url, __spreadValues({
      method: "POST",
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers),
      body: JSON.stringify(data)
    }, options));
    if (!response.ok) {
      throw new Error(`POST error ${response.status}`);
    }
    const raw = yield response.text();
    return JSON.parse(raw);
  });
}
function formatEpisodeNumber(season, episode) {
  const s = String(season).padStart(2, "0");
  const e = String(episode).padStart(2, "0");
  return `S${s}E${e}`;
}

// src/bdix/extractor.js
var TMDB_API_KEY = "86e4a75a565d93315baaa04efd6cd427";
var SERVERS = [
  { url: "http://172.16.50.12", root: "/DHAKA-FLIX-12/" },
  { url: "http://172.16.50.14", root: "/DHAKA-FLIX-14/" }
];
function getMediaName(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const tmdbUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const data = yield fetchJson(tmdbUrl);
    return data.title || data.name;
  });
}
function extractQuality(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes("2160p") || lower.includes("4k"))
    return "4K";
  if (lower.includes("1080p"))
    return "1080p";
  if (lower.includes("720p"))
    return "720p";
  if (lower.includes("480p"))
    return "480p";
  return "Unknown";
}
function formatSearchQuery(name, episodeString = "") {
  let cleanName = name.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  let query = cleanName;
  if (episodeString)
    query += ` ${episodeString}`;
  return query.replace(/ /g, "\\ ");
}
function searchBdixServers(searchQuery) {
  return __async(this, null, function* () {
    const searchPromises = SERVERS.map((server) => __async(this, null, function* () {
      try {
        const endpoint = `${server.url}${server.root}`;
        const payload = {
          action: "get",
          search: {
            href: server.root,
            ignorecase: true,
            pattern: searchQuery
          }
        };
        const response = yield postJson(endpoint, payload);
        if (response && response.search && Array.isArray(response.search)) {
          return response.search.filter((item) => {
            const lower = item.href.toLowerCase();
            return lower.endsWith(".mkv") || lower.endsWith(".mp4") || lower.endsWith(".avi");
          }).map((item) => {
            const parts = item.href.split("/");
            const filename = decodeURIComponent(parts[parts.length - 1]);
            return {
              name: `DhakaFlix (BDIX) - ${server.root.replace(/\//g, "")}`,
              title: filename,
              url: `${server.url}${item.href}`,
              quality: extractQuality(filename)
            };
          });
        }
      } catch (error) {
        return [];
      }
      return [];
    }));
    const allResults = yield Promise.all(searchPromises);
    let finalStreams = [];
    for (let i = 0; i < allResults.length; i++) {
      finalStreams = finalStreams.concat(allResults[i]);
    }
    return finalStreams;
  });
}
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    if (mediaType === "movie") {
      const movieName = yield getMediaName(tmdbId, "movie");
      return yield searchBdixServers(formatSearchQuery(movieName));
    } else if (mediaType === "tv") {
      const showName = yield getMediaName(tmdbId, "tv");
      const epString = formatEpisodeNumber(season, episode);
      return yield searchBdixServers(formatSearchQuery(showName, epString));
    }
    return [];
  });
}

// src/bdix/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      return [];
    }
  });
}
module.exports = { getStreams };
