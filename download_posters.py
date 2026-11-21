import os
import re
import json
import time
import requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

POSTER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'posters')
os.makedirs(POSTER_DIR, exist_ok=True)

def sanitize_filename(name):
    # Remove characters not allowed in filenames
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = clean.replace(" ", "_").strip()
    return clean[:50]

def fetch_poster_url(movie, session):
    tt = movie['imdb_id']
    # 1. Official IMDb Suggestion API
    try:
        url = f'https://v3.sg.media-imdb.com/suggestion/x/{tt}.json'
        r = session.get(url, timeout=6)
        if r.status_code == 200:
            data = r.json()
            for item in data.get('d', []):
                if item.get('id') == tt and 'i' in item:
                    return item['i']['imageUrl']
    except Exception:
        pass

    # 2. Cinemeta fallback
    try:
        url = f'https://v3-cinemeta.strem.io/meta/movie/{tt}.json'
        r = session.get(url, timeout=6)
        if r.status_code == 200:
            poster = r.json().get('meta', {}).get('poster')
            if poster:
                return poster
    except Exception:
        pass

    return None

def process_movie(movie):
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    rank = movie['rank']
    title = movie['title']
    tt = movie['imdb_id']
    clean_title = sanitize_filename(title)
    filename = f"{rank:03d}_{clean_title}_{tt}.jpg"
    local_path = os.path.join(POSTER_DIR, filename)
    rel_path = f"posters/{filename}"

    # Get poster URL
    poster_url = fetch_poster_url(movie, session)
    
    downloaded = False
    file_size = 0
    if poster_url:
        try:
            img_resp = session.get(poster_url, timeout=10)
            if img_resp.status_code == 200 and len(img_resp.content) > 1000:
                with open(local_path, 'wb') as f:
                    f.write(img_resp.content)
                downloaded = True
                file_size = len(img_resp.content)
        except Exception as e:
            print(f"Error downloading #{rank} {title}: {e}")

    session.close()
    return {
        'rank': rank,
        'poster_url': poster_url,
        'local_poster_path': rel_path if downloaded else None,
        'downloaded': downloaded,
        'file_size': file_size
    }

def main():
    start_time = time.time()
    with open('imdb_top_250.json', 'r', encoding='utf-8') as f:
        movies = json.load(f)

    print(f"Starting concurrent download for {len(movies)} movie posters...")
    results_map = {}

    with ThreadPoolExecutor(max_workers=25) as executor:
        future_to_movie = {executor.submit(process_movie, m): m for m in movies}
        completed_count = 0
        for future in as_completed(future_to_movie):
            res = future.result()
            results_map[res['rank']] = res
            completed_count += 1
            if completed_count % 25 == 0 or completed_count == len(movies):
                elapsed = time.time() - start_time
                print(f"Progress: {completed_count}/{len(movies)} completed in {elapsed:.1f}s")

    # Update datasets
    for m in movies:
        res = results_map.get(m['rank'])
        if res:
            m['poster_url'] = res['poster_url']
            m['local_poster_path'] = res['local_poster_path']
        else:
            m['poster_url'] = None
            m['local_poster_path'] = None

    # Write updated JSON
    with open('imdb_top_250.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)

    # Write updated CSV
    df = pd.DataFrame(movies)
    df.to_csv('imdb_top_250.csv', index=False, encoding='utf-8-sig')

    # Write updated Excel
    df.to_excel('imdb_top_250.xlsx', index=False, engine='openpyxl')

    # Summary stats
    downloaded_total = sum(1 for m in movies if m.get('local_poster_path'))
    total_bytes = sum(results_map[r]['file_size'] for r in results_map)
    total_mb = total_bytes / (1024 * 1024)
    elapsed = time.time() - start_time

    print(f"\nDone in {elapsed:.1f}s! Successfully downloaded {downloaded_total}/{len(movies)} posters ({total_mb:.2f} MB total).")

if __name__ == '__main__':
    main()
