#!/bin/bash

echo "===================================="
echo "   DonateStream Backend Setup"
echo "===================================="
echo

echo "[1/3] Installing dependencies..."
npm install

echo
echo "[2/3] Starting the server..."
echo
echo "Server will start on: http://localhost:3001"
echo "Dashboard available at: http://localhost:3001/dashboard"
echo
echo "Press Ctrl+C to stop the server"
echo

echo "[3/3] Server starting..."
npm start
