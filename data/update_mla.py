import csv
import os

file_path = 'c:/Users/chris/Documents/public acc platform/data/skd data - MLA.csv'
temp_path = 'c:/Users/chris/Documents/public acc platform/data/skd data - MLA_temp.csv'

states_to_remove = ['Kerala', 'Tamil Nadu', 'Assam', 'West Bengal', 'Puducherry']

with open(file_path, 'r', encoding='utf-8') as f_in, open(temp_path, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.reader(f_in)
    writer = csv.writer(f_out)
    
    headers = next(reader)
    writer.writerow(headers)
    
    removed_count = 0
    kept_count = 0
    
    for row in reader:
        # State is at index 3 (text-xs)
        if len(row) > 3:
            state = row[3].strip()
            if any(s in state for s in states_to_remove):
                removed_count += 1
                continue
        
        writer.writerow(row)
        kept_count += 1

print(f"Removed {removed_count} rows.")
print(f"Kept {kept_count} rows.")

os.replace(temp_path, file_path)
print("Updated skd data - MLA.csv successfully.")
