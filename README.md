# vehicle_bundler

This repository contains a script for processing and organizing vehicle packs for FiveM. The script is designed to restructure vehicle files into a single or multiple but categorized resources.

## Features

- Processes vehicle files from directories enclosed in square brackets (e.g., `[Category]` or `[Manufacturer]`)
- Creates a new resource structure for each bracketed directory
- Generates `fxmanifest.lua` files for each processed directory
- Creates `vehicleNames.lua` scripts for proper vehicle naming in-game that I was lazy to create myself all the time (You should change the names properly, since this scripts only creates placeholder names using its GameName tag that is available in vehicles.meta)
- Handles various file types including `.meta`, `.yft`, `.ytd`, `.rel`, `.nametable`, `.awc`, `.dds`, and `.png`
- Also seperates engine sounds and livery templates that are inside the folders and copy those to `engine_sounds` and `livery_template` folders
- Supports multi-threading for improved performance
- You can see the progress of each sub-directories from the console logs

## Requirements

- Bun:
  - Bun v1.1.12

## Usage

### Caution

Always backup your original files before running these scripts, as they involve file operations that could potentially overwrite or misplace files if there are unexpected issues.

### Recommended Usage

1. Download latest release from [Releases](https://github.com/TykeDev/vehicle_bundler/releases) as an executable.

2. Copy the executable to the root of the vehicle pack folder. (This is the folder where you placed the vehicles as categories, for example: `[Sports]`, `[Luxury]`, `[Ford]`, `[Toyota]`)

3. Run it and see the magic!

### Build-on-your-own Usage

`
Sadly this requires Bun runtime, you can follow the [Bun website](https://bun.sh) to install it.
`

1. Download latest source code from the [repo](https://github.com/TykeDev/vehicle_bundler)

2. Copy the files to the root of the vehicle pack folder. (This is the folder where you placed the vehicles as categories, for example: `[Sports]`, `[Luxury]`, `[Ford]`, `[Toyota]`)

3. Run these commands:

    For Bun:

    ```pwsh
    bun install
    bun run vehicle_pack_processor_bun.ts
    ```
    
4. The script will process all bracketed folders and create a new `newVehiclePack` directory with the restructured files.

## Desired Vehicle Pack Structure

```
vehiclePack/
├── [Category1]/
│   ├── vehicle1/
│   │   ├──fxmanifest.lua
│   │   ├── data/
│   │   │   └── *.meta files
│   │   └── stream/
│   │       └── *.yft, *.ytd files
│   ├── vehicle2/
│   │   ├──fxmanifest.lua
│   │   ├── data/
│   │   │   └── *.meta files
│   │   └── stream/
│   │       └── *.yft, *.ytd files
├── [Category2]/
│   ├── vehicle3/
│   │   ├──fxmanifest.lua
│   │   ├── data/
│   │   │   └── *.meta files
│   │   └── stream/
│   │       └── *.yft, *.ytd files
│   ├── vehicle4/
│   │   ├──fxmanifest.lua
│   │   ├── data/
│   │   │   └── *.meta files
│   │   └── stream/
│   │       └── *.yft, *.ytd files
```

## Output Structure

```
newVehiclePack/
├── [Category1]/
│   ├── data/
│   │   └── [VehicleName]/
│   │       └── *.meta files
│   ├── stream/
│   │   └── *.yft, *.ytd files
│   ├── fxmanifest.lua
│   └── vehicleNames.lua
├── [Category2]/
│   └── ...
├── engine_sounds/
│   ├── audioconfig/
│   │   └── *.rel, *.nametable files
│   └── sfx/
│       └── [EngineFolder]/
│           └── *.awc files
└── livery_templates/
    └── *.dds, *.png files
```

## Notes

- The scripts process folders based on their names being enclosed in square brackets `[]`, not strictly by manufacturer. This allows for flexible categorization (e.g., by vehicle type, manufacturer, or any other grouping).

## Contributing

Feel free to fork this repository and submit pull requests for any enhancements or bug fixes.