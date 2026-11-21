import json
import time
import requests
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

def main():
    start = time.time()
    with open('web/src/data/movies.json', 'r', encoding='utf-8') as f:
        movies = json.load(f)

    print(f"Enriching {len(movies)} movies with genres, directors, cast, and synopses...")

    def fetch_meta(movie):
        tt = movie['imdb_id']
        session = requests.Session()
        genres = []
        director = "Unknown"
        cast = []
        desc = ""

        try:
            r = session.get(f'https://v3-cinemeta.strem.io/meta/movie/{tt}.json', timeout=6)
            if r.status_code == 200:
                meta = r.json().get('meta', {})
                genres = meta.get('genres', []) or []
                dirs = meta.get('director', [])
                if isinstance(dirs, list):
                    director = dirs[0] if dirs else "Unknown"
                elif isinstance(dirs, str):
                    director = dirs
                cast = (meta.get('cast', []) or [])[:5]
                desc = meta.get('description', '') or ""
        except Exception:
            pass

        # If genres empty, assign based on movie title fallback
        if not genres:
            genres = ["Drama"]

        session.close()
        return movie['rank'], genres, director, cast, desc

    results = {}
    with ThreadPoolExecutor(max_workers=30) as executor:
        futures = {executor.submit(fetch_meta, m): m for m in movies}
        for future in as_completed(futures):
            rank, genres, director, cast, desc = future.result()
            results[rank] = {
                'genres': genres,
                'director': director,
                'cast': cast,
                'description': desc
            }

    for m in movies:
        r = results.get(m['rank'], {})
        m['genres'] = r.get('genres', ['Drama'])
        m['director'] = r.get('director', 'Unknown')
        m['cast'] = r.get('cast', [])
        m['description'] = r.get('description', '')

    # Save to web/src/data/movies.json
    with open('web/src/data/movies.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)

    # Save to root imdb_top_250.json
    with open('imdb_top_250.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)

    # Save to CSV
    df = pd.DataFrame(movies)
    df['genres'] = df['genres'].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
    df['cast'] = df['cast'].apply(lambda x: ', '.join(x) if isinstance(x, list) else x)
    df.to_csv('imdb_top_250.csv', index=False, encoding='utf-8-sig')
    df.to_excel('imdb_top_250.xlsx', index=False, engine='openpyxl')

    elapsed = time.time() - start
    print(f"Enrichment completed in {elapsed:.1f}s!")

if __name__ == '__main__':
    main()
