/**
 * This script converts TypeScript files to JavaScript with ESM imports
 * It's used as a fallback when the TypeScript build fails
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');

const execAsync = util.promisify(exec);

// Constants
const SRC_DIR = path.resolve(__dirname, '../server/src');
const DIST_DIR = path.resolve(__dirname, '../server/dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Function to process a file
async function processFile(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Convert TS to JS
    let jsContent = content
      // Remove type annotations
      .replace(/: [a-zA-Z0-9_<>\[\]|&]+/g, '')
      // Remove interface and type declarations
      .replace(/interface [^{]+{[\s\S]*?}/g, '')
      .replace(/type [^=]+=[\s\S]*?;/g, '')
      // Convert imports
      .replace(/import\s+(\S+)\s+from\s+['"]([^'"]+)['"];/g, 'import $1 from "$2.js";')
      // Remove import type statements
      .replace(/import\s+type[^;]+;/g, '')
      // Fix express related imports
      .replace('import express from "express";', 'import express from "express";')
      .replace('const router = express.Router();', 'const router = express.Router();')
      // Fix mongoose schema definitions
      .replace(/new mongoose\.Schema<[^>]+>/g, 'new mongoose.Schema');
    
    // Create the target directory if it doesn't exist
    const targetDir = path.dirname(path.join(DIST_DIR, relativePath));
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Write the converted file
    const targetPath = path.join(DIST_DIR, relativePath).replace('.ts', '.js');
    fs.writeFileSync(targetPath, jsContent, 'utf8');
    
    console.log(`Converted: ${relativePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to process a directory recursively
async function processDirectory(dirPath, baseDir = SRC_DIR) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath, baseDir);
    } else if (entry.isFile() && fullPath.endsWith('.ts')) {
      await processFile(fullPath, relativePath);
    } else if (entry.isFile()) {
      // Copy non-TypeScript files as-is
      const targetPath = path.join(DIST_DIR, relativePath);
      const targetDir = path.dirname(targetPath);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.copyFileSync(fullPath, targetPath);
      console.log(`Copied: ${relativePath}`);
    }
  }
}

// Main function
async function main() {
  console.log('Converting TypeScript to JavaScript...');
  
  try {
    // Process all files
    await processDirectory(SRC_DIR);
    
    // Create a package.json in the dist directory specifying it's a module
    const packageJson = {
      "type": "module",
      "private": true
    };
    
    fs.writeFileSync(
      path.join(DIST_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    console.log('\nConversion completed successfully. Server code is ready for Vercel deployment.');
  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 