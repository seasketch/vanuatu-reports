#!/bin/bash

# OKAY! Here's how the OUS Demographic set up works in the Vanuatu reports (from data/bin folder):
# 1. Run this script data folder to create json: 
#    ./1-ousDemographicPrep.sh
# 2. Run this script to publish fgb to aws:
#    ./2-ousDemographicPublish.sh
# 3. Run this script to precalculate demographics data overlap:
#    npx tsx 3-ousDemographicPrecalc.ts

# Pares down OUS demographic data (copied from Data Products) to what reports need
# and saves into data/dist/ous_demographics.json for use in precalc 

# Delete old merged geojson since ogr2ogr can't overwrite it
rm ./ous_demographics.geojson

# Select only necessary columns
ogr2ogr -t_srs "EPSG:4326" -f GeoJSON -nlt PROMOTE_TO_MULTI -wrapdateline -dialect OGRSQL -sql "select all_sectors.response_id as resp_id, all_sectors.sector as sector, all_sectors.participants as number_of_ppl, all_sectors.represented_in_sector as rep_in_sector, all_sectors.village as village, all_sectors.fishing_type as fishing_type, all_sectors.fishing_method as fishing_method from all_sectors" ./ous_demographics.geojson ../src/heatmaps/shapes/emau/all_sectors.geojson  

# Delete old dist files in prep for new
rm ../dist/ous_demographics.json
rm ../dist/ous_demographics.fgb

# Sort by respondent_id
npx tsx ousDemographicSort.ts

# Create json file for direct import by precalc
cp ./ous_demographics_sorted.geojson ../dist/ous_demographics.json

# Generate cloud-optimized Flatgeobuf
./genFgb.sh ../dist/ous_demographics.json ../dist ous_demographics 'SELECT * FROM all_sectors' -nlt PROMOTE_TO_MULTI