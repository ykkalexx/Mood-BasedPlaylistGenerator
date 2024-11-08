# get-started.ps1

# Install Node.js dependencies
Write-Output "Installing Node.js dependencies..."
cd ./src/api
npm install

# Install Python dependencies
Write-Output "Installing Python dependencies..."
cd ../ml
pip install -r requirements.txt

# Start Node.js service
Write-Output "Starting Node.js service..."
Start-Process powershell -ArgumentList "cd ./src/api; npm run dev" -NoNewWindow

# Start Python service
Write-Output "Starting Python service..."
Start-Process powershell -ArgumentList "cd ./src/ml; python app.py" -NoNewWindow