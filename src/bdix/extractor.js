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

// We only format the base name now, no episode strings attached
function formatSearchQuery(name) {
    let cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    return cleanName.replace(/ /g, '\\ ');
}

async function searchBdixServers(searchQuery, mediaType, targetSeason = null, targetEpisode = null, targetYear = null) {
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
                        const parts = item.href.split('/');
                        const filename = decodeURIComponent(parts[parts.length - 1]).toLowerCase();
                        
                        // 1. Must be a video file
                        const isVideo = lower.endsWith('.mkv') || lower.endsWith('.mp4') || lower.endsWith('.avi');
                        if (!isVideo) return false;

                        // 2. Directory Path Filtering (Keep movies out of TV folders, and vice versa)
                        if (mediaType === 'movie' && (lower.includes('tv-web-series') || lower.includes('tv series'))) {
                            return false;
                        }
                        if (mediaType === 'tv' && (lower.includes('english movies') || lower.includes('hindi movies') || lower.includes('movies'))) {
                            return false;
                        }

                        // 3. TV Show Episode Filtering
                        if (mediaType === 'tv' && targetSeason !== null && targetEpisode !== null) {
                            const s = String(targetSeason).padStart(2, '0');
                            const e = String(targetEpisode).padStart(2, '0');
                            const epRegex = new RegExp(`s${s}[. _-]?e${e}`, 'i');
                            
                            if (!epRegex.test(filename)) {
                                return false; 
                            }
                        }

                        // 4. Movie Release Year Filtering
                        if (mediaType === 'movie' && targetYear) {
                            // If the filename doesn't contain the release year, drop it
                            if (!filename.includes(targetYear)) {
                                return false;
                            }
                        }

                        return true;
                    })
                    .map(item => {
                        const parts = item.href.split('/');
                        const filename = decodeURIComponent(parts[parts.length - 1]);
                        
                        return {
                            name: `DhakaFlix (BDIX) - ${server.root.replace(/\//g, '')}\n${filename}`,
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
    // We now fetch the raw TMDB data directly here so we can extract the release year
    const tmdbUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const data = await fetchJson(tmdbUrl);
    const title = data.title || data.name;
    
    if (mediaType === 'movie') {
        // Extract the 4-digit year from the release_date (e.g., "1999-03-30" -> "1999")
        const year = data.release_date ? data.release_date.split('-')[0] : null;
        return await searchBdixServers(formatSearchQuery(title), 'movie', null, null, year);
    } else if (mediaType === 'tv') {
        const epString = formatEpisodeNumber(season, episode);
        return await searchBdixServers(formatSearchQuery(title), 'tv', season, episode, null);
    }
    return [];
}