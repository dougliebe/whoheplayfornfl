import csv
import requests
import os
from urllib.parse import urlparse

def download_logos():
    # Read the CSV file
    with open('nfl_teamlogos.csv', 'r') as file:
        reader = csv.DictReader(file)
        
        # Create logos directory if it doesn't exist
        if not os.path.exists('logos'):
            os.makedirs('logos')
        
        # Set headers with User-Agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Download each logo
        for row in reader:
            url = row['url']
            team_code = row['team_code']
            
            # Get the file extension from the URL
            parsed_url = urlparse(url)
            file_extension = os.path.splitext(parsed_url.path)[1]
            
            # Create the filename
            filename = f'logos/{team_code}{file_extension}'
            
            try:
                # Download the image with headers
                response = requests.get(url, headers=headers)
                response.raise_for_status()  # Raise an exception for bad status codes
                
                # Save the image
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f'Successfully downloaded {filename}')
                
            except Exception as e:
                print(f'Error downloading {filename}: {str(e)}')

if __name__ == '__main__':
    download_logos() 