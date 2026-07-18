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
    return {
        title: data.title || data.name,
        year: data.release_date ? data.release_date.split('-')[0] : null
    };
}

function extractQuality(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes("2160p") || lower.includes("4k")) return "4K";
    if (lower.includes("1080p")) return "1080p";
    if (lower.includes("720p")) return "720p";
    if (lower.includes("480p")) return "480p";
    return "Unknown";
}

// Generates search patterns to target both spaces and dot-separated directories/files
function getSearchQueries(name) {
    let cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    return [
        cleanName.replace(/ /g, '\\ '),         // Space-escaped pattern (e.g., "Love\ Revolution")
        cleanName.replace(/ /g, '.')            // Dot-separated pattern (e.g., "Love.Revolution")
    ];
}

async function searchBdixServers(searchQueries, mediaType, targetSeason = null, targetEpisode = null, targetYear = null) {
    let finalStreams = [];
    let seenUrls = new Set();

    // Loop through queries sequentially (Index 0: Spaces, Index 1: Dots)
    for (const query of searchQueries) {
        
        // Fire requests to Server 12 and 14 for THIS specific query only
        const searchPromises = SERVERS.map(async (server) => {
            try {
                const endpoint = `${server.url}${server.root}`;
                const payload = {
                    action: "get",
                    search: {
                        href: server.root,
                        ignorecase: true,
                        pattern: query
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

                            // 2. Directory Path Filtering
                            if (mediaType === 'movie' && (lower.includes('tv-web-series') || lower.includes('tv series'))) return false;
                            if (mediaType === 'tv' && (lower.includes('english movies') || lower.includes('hindi movies') || lower.includes('movies'))) return false;

                            // 3. TV Show Episode Filtering
                            if (mediaType === 'tv' && targetSeason !== null && targetEpisode !== null) {
                                const s = String(targetSeason).padStart(2, '0');
                                const e = String(targetEpisode).padStart(2, '0');
                                const epRegex = new RegExp(`s${s}[. _-]?e${e}`, 'i');
                                if (!epRegex.test(filename)) return false; 
                            }

                            // 4. Movie Release Year Filtering
                            if (mediaType === 'movie' && targetYear && !filename.includes(targetYear)) return false;

                            return true;
                        })
                        .map(item => {
                            const parts = item.href.split('/');
                            const filename = decodeURIComponent(parts[parts.length - 1]);
                            const qualityVal = extractQuality(filename);
                            
                            return {
                                // Title row with the new vertical separator
                                name: `DhakaFlix (BDIX) | ${server.root.replace(/\//g, '')}`,
                                title: filename,
                                url: `${server.url}${item.href}`,
                                // Pushing the filename and quality into the native small-font field with requested spacing
                                quality: `\n🎬 ${filename}\n\n${qualityVal}`
                            };
                        });
                }
            } catch (error) {
                return [];
            }
            return [];
        });

        // Wait for both Server 12 and Server 14 to finish THIS query
        const allResults = await Promise.all(searchPromises);
        
        // Collect and deduplicate results securely
        for (let i = 0; i < allResults.length; i++) {
            allResults[i].forEach(stream => {
                if (!seenUrls.has(stream.url)) {
                    seenUrls.add(stream.url);
                    finalStreams.push(stream);
                }
            });
        }

        // SMART FALLBACK TRIGGER:
        // If we found streams, break the loop immediately. We don't need to fire the dot query.
        if (finalStreams.length > 0) {
            break;
        }
    }
    
    return finalStreams;
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
    const media = await getMediaName(tmdbId, mediaType);
    const queries = getSearchQueries(media.title);
    
    if (mediaType === 'movie') {
        return await searchBdixServers(queries, 'movie', null, null, media.year);
    } else if (mediaType === 'tv') {
        return await searchBdixServers(queries, 'tv', season, episode, null);
    }
    return [];
}