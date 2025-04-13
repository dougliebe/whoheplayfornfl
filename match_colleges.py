import csv
import re

def clean_name(name):
    """Clean and standardize school names for better matching"""
    if not name:
        return ""
    # Remove common suffixes and clean up
    name = name.lower()
    # Normalize different types of hyphens to standard hyphen
    name = name.replace('–', '-')  # en dash
    name = name.replace('—', '-')  # em dash
    name = name.replace('‐', '-')  # hyphen
    name = re.sub(r'\s+', ' ', name)  # Normalize spaces
    return name.strip()

def load_logos_data():
    """Load and process logos.csv data"""
    logos_data = {}
    with open('logos.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Create a set of all possible names for this school
            names = set()
            # Add main school name
            if row['school']:
                names.add(clean_name(row['school']))
            # Add alternative names (skip 3-character abbreviations)
            for alt in ['alt_name1', 'alt_name2', 'alt_name3']:
                if row[alt] and len(row[alt].strip()) > 3:
                    names.add(clean_name(row[alt]))
            
            # Store all names with the school's ID and colors
            for name in names:
                if name:  # Only add non-empty names
                    logos_data[name] = {
                        'id': row['id'],
                        'school': row['school'],
                        'color': row['color'],
                        'alt_color': row['alt_color']
                    }
                    
            # Debug logging for Southern California
            if 'southern california' in [n.lower() for n in names]:
                print(f"\nFound Southern California in logos.csv:")
                print(f"School: {row['school']}")
                print(f"ID: {row['id']}")
                print(f"Alt names: {[row[alt] for alt in ['alt_name1', 'alt_name2', 'alt_name3']]}")
                print(f"All names for this school: {names}")
    return logos_data

def load_sportsref_colleges():
    """Load unique college names from sportsref_download.csv"""
    colleges = set()
    with open('sportsref_download.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['College']:  # Note: Column name is 'College' with capital C
                colleges.add(row['College'])
    return sorted(colleges)

def find_matches():
    """Find matches between sportsref colleges and logos data"""
    logos_data = load_logos_data()
    sportsref_colleges = load_sportsref_colleges()
    
    matches = []
    no_matches = []
    
    for college in sportsref_colleges:
        cleaned_college = clean_name(college)
        matched = False
        
        # Debug logging for Southern California
        if cleaned_college == 'southern california':
            print(f"\nProcessing Southern California:")
            print(f"Cleaned name: {cleaned_college}")
            print(f"Available matches in logos_data: {[k for k in logos_data.keys() if 'southern' in k or 'california' in k]}")
        
        # Only try exact match
        if cleaned_college in logos_data:
            match_data = logos_data[cleaned_college]
            matches.append({
                'sportsref_name': college,
                'logos_name': match_data['school'],
                'id': match_data['id'],
                'color': match_data['color'],
                'alt_color': match_data['alt_color']
            })
            matched = True
            if cleaned_college == 'southern california':
                print(f"Exact match found with ID: {match_data['id']}")
        
        if not matched:
            no_matches.append(college)
            if cleaned_college == 'southern california':
                print("No exact match found for Southern California")
    
    return matches, no_matches

def save_matches_to_csv(matches, no_matches):
    """Save the matches to a CSV file"""
    with open('college_matches.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['sportsref_name', 'logos_name', 'id', 'color', 'alt_color'])
        writer.writeheader()
        writer.writerows(matches)
    
    with open('unmatched_colleges.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['college_name'])
        writer.writerows([[college] for college in no_matches])

def main():
    matches, no_matches = find_matches()
    
    # Save results to CSV files
    save_matches_to_csv(matches, no_matches)
    
    # Print summary
    print(f"\nSummary:")
    print(f"Total colleges in sportsref: {len(matches) + len(no_matches)}")
    print(f"Matched: {len(matches)}")
    print(f"Unmatched: {len(no_matches)}")
    print("\nResults have been saved to 'college_matches.csv' and 'unmatched_colleges.csv'")

if __name__ == "__main__":
    main() 