#!/bin/bash

git pull

cd ./client
npm install
npm run build

cd ../server
npm install
npm run build

npm run start:reload
