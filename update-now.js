#!/usr/bin/env node

/**
 * Updates the Now page archive.
 *
 * Usage: node update-now.js
 *
 * 1. Edit now-draft-paragraph.html with your new paragraph
 * 2. Edit now-draft-courses.txt with your courses (one per line)
 * 3. Run this script
 * 4. It will archive the current "Now" and apply your draft
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_FILE = path.join(__dirname, 'now-archive.json');
const PARAGRAPH_FILE = path.join(__dirname, 'now-draft-paragraph.html');
const COURSES_FILE = path.join(__dirname, 'now-draft-courses.txt');
const SPOTIFY_WORKER_URL = 'https://my-spotify-worker.ben-pomeranz.workers.dev';

async function fetchSpotifySnapshot() {
    try {
        const response = await fetch(SPOTIFY_WORKER_URL);
        if (!response.ok) {
            console.warn('Warning: Could not fetch Spotify data, archiving without it.');
            return null;
        }
        const data = await response.json();
        return {
            title: data.title || null,
            artists: data.artists || null,
            album: data.album || null,
            cover: data.cover || null,
            url: data.url || null
        };
    } catch (error) {
        console.warn('Warning: Could not fetch Spotify data:', error.message);
        return null;
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function readParagraph() {
    if (!fs.existsSync(PARAGRAPH_FILE)) {
        return null;
    }
    let content = fs.readFileSync(PARAGRAPH_FILE, 'utf8');

    // Remove HTML comments (instructions)
    content = content.replace(/<!--[\s\S]*?-->/g, '');

    // Collapse newlines to spaces, trim
    content = content.replace(/\s+/g, ' ').trim();

    return content || null;
}

function readCourses() {
    if (!fs.existsSync(COURSES_FILE)) {
        return [];
    }
    const content = fs.readFileSync(COURSES_FILE, 'utf8');

    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')); // Skip empty lines and comments
}

async function main() {
    // Read draft files
    const paragraph = readParagraph();
    const courses = readCourses();

    // Validate
    if (!paragraph) {
        console.error('Error: now-draft-paragraph.html is empty or not found.');
        console.error('Add your new paragraph content to this file.');
        process.exit(1);
    }

    if (courses.length === 0) {
        console.error('Error: now-draft-courses.txt is empty or not found.');
        console.error('Add your courses (one per line) to this file.');
        process.exit(1);
    }

    // Read current archive
    if (!fs.existsSync(ARCHIVE_FILE)) {
        console.error('Error: now-archive.json not found.');
        process.exit(1);
    }

    const archive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8'));

    console.log('Fetching current Spotify track for snapshot...');
    const spotifySnapshot = await fetchSpotifySnapshot();

    if (spotifySnapshot) {
        console.log(`  Captured: "${spotifySnapshot.title}" by ${spotifySnapshot.artists}`);
    } else {
        console.log('  No Spotify data captured.');
    }

    // Create past entry from current
    const pastEntry = {
        date: archive.lastUpdated,
        paragraph: archive.current.paragraph,
        courses: archive.current.courses
    };

    if (spotifySnapshot) {
        pastEntry.spotify = spotifySnapshot;
    }

    // Add to beginning of past array
    archive.past.unshift(pastEntry);

    // Update current with draft
    archive.current = {
        paragraph: paragraph,
        courses: courses
    };

    // Update lastUpdated
    archive.lastUpdated = formatDate(new Date());

    // Save archive
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2) + '\n');
    console.log('\nArchive updated successfully!');
    console.log(`  - Previous "Now" (from ${pastEntry.date}) moved to Past`);
    console.log(`  - New "Now" applied from draft`);
    console.log(`  - Last updated: ${archive.lastUpdated}`);

    console.log('\nDraft files left as-is. Clear them when ready for next update.');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
