import csv
from collections import Counter

f = open('c:/Users/chris/Documents/public acc platform/data/skd data - MLA.csv', 'r', encoding='utf-8')
reader = csv.DictReader(f)
c = Counter(row.get('text-xs', '') for row in reader)
for state, count in c.most_common():
    print(f"{state}: {count}")
