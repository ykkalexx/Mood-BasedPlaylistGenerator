# Start-Project.ps1

# Navigate to the src/api directory and start the Node.js service
Start-Process powershell -ArgumentList "cd ./src/api; npm run dev" -NoNewWindow

# Navigate to the src/ml directory and start the Python service
Start-Process powershell -ArgumentList "cd ./src/ml; python app.py" -NoNewWindow