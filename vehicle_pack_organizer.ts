import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";

function processFile(filePath: string, manufacturer: string, newResourcePath: string, rootPath: string) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(fileName).toLowerCase();
    
    if(fileName.endsWith('vehicles.meta')) {
        const fileContent = readFileSync(filePath, 'utf-8');
        const spawnNames = [...fileContent.matchAll(/<Item>[\s\S]*?<modelName>(?<name>[\s\S]*?)<\/modelName>[\s\S]*?<\/Item>/g)]
            .map(match => match.groups?.name).filter(Boolean);
        const gameNames = [...fileContent.matchAll(/<Item>[\s\S]*?<gameName>(?<name>[\s\S]*?)<\/gameName>[\s\S]*?<\/Item>/g)]
            .map(match => match.groups?.name).filter(Boolean);
        
        gameNames.forEach(gameName => {
            vehicleNames.push(`\tAddTextEntry("${gameName}", "${gameName}")\n`);
        });

        const fullNewPath = path.join(newResourcePath, manufacturer, 'data', spawnNames[0] || '');
        mkdirSync(fullNewPath, { recursive: true });

        const metaFilesPath = path.dirname(filePath);
        readdirSync(metaFilesPath).forEach(file => {
            if(file.endsWith(".meta")) {
                const content = readFileSync(path.join(metaFilesPath, file));
                writeFileSync(path.join(fullNewPath, file), content);
            }
        });
    }
    else if (fileExt === ".yft" || fileExt === ".ytd" || fileName.endsWith(".yft.xml")) {
        const manufacturerStreamPath = path.join(newResourcePath, manufacturer, 'stream');
        mkdirSync(manufacturerStreamPath, { recursive: true });
        copyFileSync(filePath, path.join(manufacturerStreamPath, fileName));
    }
    else if (fileExt === ".rel" || fileExt === ".nametable") {
        const audioconfigPath = path.join(rootPath, 'engine_sounds', 'audioconfig');
        mkdirSync(audioconfigPath, { recursive: true });
        copyFileSync(filePath, path.join(audioconfigPath, fileName));
    }
    else if (fileExt === ".awc") {
        const sfxPath = path.join(rootPath, 'engine_sounds', 'sfx');
        const parentFolderName = path.basename(path.dirname(filePath));
        const targetPath = path.join(sfxPath, parentFolderName);
        mkdirSync(targetPath, { recursive: true });
        copyFileSync(filePath, path.join(targetPath, fileName));
    }
    else if (fileExt === ".dds" || fileExt === ".png") {
        const liveryPath = path.join(rootPath, 'livery_templates');
        mkdirSync(liveryPath, { recursive: true });
        copyFileSync(filePath, path.join(liveryPath, fileName));
    }
}

function processDirectory(dirPath: string, manufacturer: string, newResourcePath: string, rootPath: string) {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            processDirectory(fullPath, manufacturer, newResourcePath, rootPath);
        } else if (entry.isFile()) {
            processFile(fullPath, manufacturer, newResourcePath, rootPath);
        }
    }
}

function processManufacturer(currPath: string, newResourcePath: string, rootPath: string) {
    const manufacturer = currPath.replace('[', '').replace(']', '');
    const manufacturerDataPath = path.join(newResourcePath, manufacturer, 'data');
    const fxmanifestPath = path.join(newResourcePath, manufacturer, 'fxmanifest.lua');
    const vehicleNameScriptPath = path.join(newResourcePath, manufacturer, 'vehicleNames.lua');
    
    mkdirSync(manufacturerDataPath, { recursive: true });

    const fxmanifestString = `fx_manifest 'adamant'
game 'gta5'
description ''
author ''

files {
    'data/**/*.meta',
    'data/**/*.xml',
    'data/**/*.dat',
    'data/**/*.ytyp'
}

data_file 'HANDLING_FILE'                   'data/**/handling*.meta'
data_file 'VEHICLE_LAYOUTS_FILE'            'data/**/vehiclelayouts*.meta'
data_file 'VEHICLE_METADATA_FILE'           'data/**/vehicles*.meta'
data_file 'CARCOLS_FILE'                    'data/**/carcols*.meta'
data_file 'VEHICLE_VARIATION_FILE'          'data/**/carvariations*.meta'
data_file 'CONTENT_UNLOCKING_META_FILE'     'data/**/*unlocks.meta'
data_file 'PTFXASSETINFO_FILE'              'data/**/ptfxassetinfo.meta'

client_scripts {
   'vehicleNames.lua',
}`;

    vehicleNames = ["Citizen.CreateThread(function()\n"];

    processDirectory(currPath, manufacturer, newResourcePath, rootPath);

    vehicleNames.push("end)");
    const vehicleNamesLuaString = vehicleNames.join("");
    writeFileSync(vehicleNameScriptPath, vehicleNamesLuaString);
    writeFileSync(fxmanifestPath, fxmanifestString);

    return manufacturer;
}

let vehicleNames = [];

if (isMainThread) {
    const rootPath = process.cwd();
    const newResourcePath = path.join(rootPath, 'newVehiclePack');
    mkdirSync(newResourcePath, { recursive: true });

    // Create the new directories for engine sounds and livery templates
    mkdirSync(path.join(rootPath, 'engine_sounds', 'audioconfig'), { recursive: true });
    mkdirSync(path.join(rootPath, 'engine_sounds', 'sfx'), { recursive: true });
    mkdirSync(path.join(rootPath, 'livery_templates'), { recursive: true });

    const manufacturers = readdirSync(rootPath).filter(dir => 
        statSync(dir).isDirectory() && dir.startsWith('[') && dir.endsWith(']') && !dir.includes('/')
    );
    const totalManufacturers = manufacturers.length;
    let processedManufacturers = 0;

    const numCPUs = require('os').cpus().length;
    const chunkSize = Math.ceil(manufacturers.length / numCPUs);
    const chunks = [];
    for (let i = 0; i < manufacturers.length; i += chunkSize) {
        chunks.push(manufacturers.slice(i, i + chunkSize));
    }

    chunks.forEach((chunk, index) => {
        const worker = new Worker(__filename, {
            workerData: { manufacturers: chunk, workerId: index, newResourcePath, rootPath }
        });

        worker.on('message', (message) => {
            if (message.type === 'progress') {
                processedManufacturers++;
                const progress = (processedManufacturers / totalManufacturers * 100).toFixed(2);
                console.log(`Overall Progress: ${progress}% - ${message.manufacturer} finished!`);
            }
        });

        worker.on('error', error => {
            console.error(`Worker error: ${error}`);
        });

        worker.on('exit', code => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
        });
    });
} else {
    const { manufacturers, workerId, newResourcePath, rootPath } = workerData;

    manufacturers.forEach((currPath: string) => {
        try {
            if (existsSync(currPath)) {
                const manufacturer = processManufacturer(currPath, newResourcePath, rootPath);
                parentPort?.postMessage({ type: 'progress', manufacturer });
            } else {
                console.error(`Directory does not exist: ${currPath}`);
            }
        } catch (error) {
            console.error(`Error processing ${currPath}: ${error}`);
        }
    });
}