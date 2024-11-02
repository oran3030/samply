// setup.js
const fs = require('fs');
const path = require('path');

function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

function moveFile(source, destination) {
    if (fs.existsSync(source)) {
        const destDir = path.dirname(destination);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.renameSync(source, destination);
        console.log(`Moved: ${source} -> ${destination}`);
    }
}

function createFile(filepath, content) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, content);
    console.log(`Created file: ${filepath}`);
}

// יצירת תיקיות
const directories = [
    'src/api',
    'src/core',
    'src/services',
    'src/utils',
    'dll',
    'docs/technical',
    'docs/user',
    'docs/dev',
    'config',
    'scripts',
    'tests/unit',
    'tests/integration',
    'tests/e2e',
    'tests/fixtures/samples',
    'tests/fixtures/mockData',
    'tests/helpers',
    'tests/setup'
];

// העברת קבצים
const fileMoves = {
    'apiManager.js': 'src/api/apiManager.js',
    'eventManager.js': 'src/api/eventManager.js',
    'audioAnalysis.js': 'src/core/audioAnalysis.js',
    'flStudioBridge.js': 'src/core/flStudioBridge.js',
    'cacheManager.js': 'src/services/cacheManager.js',
    'dbManager.js': 'src/services/dbManager.js',
    'fileHandling.js': 'src/services/fileHandling.js',
    'configManager.js': 'src/utils/configManager.js',
    'logger.js': 'src/utils/logger.js',
    'securityManager.js': 'src/utils/securityManager.js',
    'FLStudioBridge.cpp': 'dll/FLStudioBridge.cpp',
    'babel.config.js': 'config/babel.config.js',
    'webpack.config.js': 'config/webpack.config.js',
    'install.js': 'scripts/install.js'
};

// תוכן קבצי קונפיגורציה
const configFiles = {
    'package.json': JSON.stringify({
        "name": "sample-manager",
        "version": "1.0.0",
        "description": "Professional Sample Manager for FL Studio",
        "scripts": {
            "dev": "webpack serve --mode development",
            "build": "webpack --mode production",
            "test": "jest",
            "lint": "eslint src",
            "format": "prettier --write \"src/**/*.{js,jsx}\""
        }
    }, null, 2),

    '.env': `FL_STUDIO_PATH=C:\\Program Files\\Image-Line\\FL Studio 20
SAMPLE_LIBRARY_PATH=C:\\Samples
DEBUG=true`,

    '.gitignore': `node_modules/
dist/
.env
*.log
.DS_Store
coverage/`,

    'README.md': `# Sample Manager

Professional sample management system for FL Studio.

## Setup
1. Install dependencies: \`npm install\`
2. Configure FL Studio path in \`.env\`
3. Run development server: \`npm run dev\`

## Testing
- Run tests: \`npm test\`
- Run linter: \`npm run lint\`

## Building
- Build project: \`npm run build\``,

    'jest.config.js': `module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js']
};`,

    '.eslintrc.js': `module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021
  },
  env: {
    node: true,
    browser: true
  }
};`,

    '.prettierrc': JSON.stringify({
        "semi": true,
        "trailingComma": "es5",
        "singleQuote": true,
        "printWidth": 80,
        "tabWidth": 2
    }, null, 2)
};

function setup() {
    try {
        // יצירת תיקיות
        directories.forEach(dir => createDirectory(dir));

        // העברת קבצים
        Object.entries(fileMoves).forEach(([source, dest]) => {
            moveFile(source, dest);
        });

        // יצירת קבצי קונפיגורציה
        Object.entries(configFiles).forEach(([filename, content]) => {
            createFile(filename, content);
        });

        // העברת tests/index.js
        if (fs.existsSync('tests/index.js')) {
            moveFile('tests/index.js', 'tests/setup/index.js');
        }

        console.log('\nProject setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Install Node.js if not installed');
        console.log('2. Run: npm install');
        console.log('3. Run: npm run dev');

    } catch (error) {
        console.error('Error during setup:', error);
    }
}

setup();