import {exec} from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const dirName = path.dirname(fileURLToPath(import.meta.url));

import config from '../src/CONFIG/videoOptimizer.json'

const { sizes } = config;


const optimizeVideos = async (logger) => {
    logger.info('Video optimizer running!');
    const inputDir = path.join(dirName, '../src/assets/videos');
    const outputDir = path.join(dirName, '../public/videos');

    logger.info(`Looking for videos in: ${inputDir}`);
    
    const videos = await glob('**/*.mp4', { cwd: inputDir });

    for (const video of videos) {
        const inputPath = path.join(inputDir, video);
        const baseName = path.basename(video, '.mp4');

        //make the sizes
        for (const [index, size] of sizes.entries()) {
            const fileName = `${baseName}-${size.label}.mp4`;
            const outputPath = path.join(outputDir, fileName);
            const command = `` +
                            `ffmpeg -i ${inputPath} ` +
                            `-vf scale=${size.width}:${size.height} ` +
                            `-b:v 1M -maxrate 1M -bufsize 2M `+
                            `-c:v libx264 -preset fast `+
                            `-an `+
                            `-movflags +faststart `+
                            `-y "${outputPath}"`;

            try {
                await execAsync(command);
                logger.info(`Generated ${fileName }`);
            } catch (error) {
                logger.error(`FFmpeg failed: ${error.message}`);
            }
        }
        
        //make a poster from the smallest size
        const posterPath = path.join(outputDir, `${baseName}-poster.jpg`);
        const posterCommand = `ffmpeg -y -i "${inputPath}" -ss 0 -vframes 1 -vf "scale=${sizes[0].width}:${sizes[0].height}" -q:v 2 -f image2 -update 1 "${posterPath}"`;        try {
            await execAsync(posterCommand);
            logger.info(`Poster generated: ${baseName}-poster.jpg`);
        } catch (error) {
            logger.error(`Poster failed for ${baseName}: ${error.message}`);
        }
    }
}
export default function videoOptimizer() {
    return {
        name: 'video-optimizer',
        //run on build and on server start
        hooks: {
            'astro:build:start': async ({ logger }) => {
                await optimizeVideos(logger); 
            },
            'astro:server:start': async ({ logger }) => {
                await optimizeVideos(logger);
            }
        }
    };
}
