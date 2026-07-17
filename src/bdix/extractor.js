/**
 * DhakaFlix BDIX Extractor
 * Handles native network requests to internal ISP servers.
 */

import { fetchJson, postJson, formatEpisodeNumber } from './http.js';

const TMDB_API_KEY = "86e4a75a565d93315baaa04efd6cd427";

const SERVERS = [
    { url: "http://172.16.50.12", root: "/DHAKA-FLIX-12/" },
    { url: "http://172.16.50.14", root: "/DHAKA-FLIX-14/" }
];

async function getMediaName(tmdbId, mediaType) {
    const tmdbUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const data = await fetchJson(tmdbUrl);
    return data.title || data.name;
}

function extractQuality(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes("2160p") || lower.includes("4k")) return "4K";
    if (lower.includes("1080p")) return "1080p";
    if (lower.includes("720p")) return "720p";
    if (lower.includes("480p")) return "480p";
    return "Unknown";
}

function formatSearchQuery(name, episodeString = "") {
    let cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    let query = cleanName;
    if (episodeString) query += ` ${episodeString}`;
    return query.replace(/ /g, '\\ ');
}

async function searchBdixServers(searchQuery) {
    const searchPromises = SERVERS.map(async (server) => {
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
            
            const response = await postJson(endpoint, payload);
            
            if (response && response.search && Array.isArray(response.search)) {
                return response.search
                    .filter(item => {
                        const lower = item.href.toLowerCase();
                        return lower.endsWith('.mkv') || lower.endsWith('.mp4') || lower.endsWith('.avi');
                    })
                    .map(item => {
                        const parts = item.href.split('/');
                        const filename = decodeURIComponent(parts[parts.length - 1]);
                        
                        return {
                            name: `DhakaFlix (BDIX) - ${server.root.replace(/\//g, '')}`,
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
    });

    const allResults = await Promise.all(searchPromises);
    
    let finalStreams = [];
    for (let i = 0; i < allResults.length; i++) {
        finalStreams = finalStreams.concat(allResults[i]);
    }
    return finalStreams;
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
    if (mediaType === 'movie') {
        const movieName = await getMediaName(tmdbId, 'movie');
        return await searchBdixServers(formatSearchQuery(movieName));
    } else if (mediaType === 'tv') {
        const showName = await getMediaName(tmdbId, 'tv');
        const epString = formatEpisodeNumber(season, episode);
        return await searchBdixServers(formatSearchQuery(showName, epString));
    }
    return [];
}