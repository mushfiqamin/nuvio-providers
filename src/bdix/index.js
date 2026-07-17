/**
 * Dhaka Flix BDIX Provider
 * Main entry interface required by Nuvio.
 */

import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = await extractStreams(tmdbId, mediaType, season, episode);
        return streams;
    } catch (error) {
        return [];
    }
}

module.exports = { getStreams };