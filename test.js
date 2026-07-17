const { getStreams } = require('./providers/bdix.js');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function runTest() {
    console.log("--- BDIX Local Provider Tester ---");

    rl.question('Enter TMDB ID: ', (tmdbId) => {
        rl.question('Enter Media Type (movie/tv): ', (mediaType) => {
            rl.question('Enter Season (or 0 for movie): ', (season) => {
                rl.question('Enter Episode (or 0 for movie): ', async (episode) => {
                    
                    console.log(`\nFetching: ${mediaType} | ID: ${tmdbId} | S:${season} E:${episode}...`);

                    try {
                        // Convert inputs to numbers where appropriate
                        const streams = await getStreams(
                            tmdbId, 
                            mediaType, 
                            parseInt(season) || null, 
                            parseInt(episode) || null
                        );

                        console.log(`\n--- SUCCESS: Found ${streams.length} streams ---`);
                        console.log(streams);

                    } catch (error) {
                        console.error("\n--- ERROR LOG ---");
                        console.error("Failed to fetch streams:");
                        console.error(error.message);
                        console.error("Stack trace:", error.stack);
                    } finally {
                        rl.close();
                    }
                });
            });
        });
    });
}

runTest();