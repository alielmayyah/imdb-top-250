import re
import json
import pandas as pd

def parse_duration(d_str):
    h = 0
    m = 0
    h_m = re.search(r'(\d+)h', d_str)
    if h_m:
        h = int(h_m.group(1))
    m_m = re.search(r'(\d+)m', d_str)
    if m_m:
        m = int(m_m.group(1))
    return h * 60 + m

def parse_votes(v_str):
    v = v_str.strip().upper()
    if v.endswith('M'):
        return int(float(v[:-1]) * 1_000_000)
    elif v.endswith('K'):
        return int(float(v[:-1]) * 1_000)
    else:
        return int(v)

def main():
    with open('raw_data.txt', 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'#(\d+)\n\[(.*?)\]\((.*?)\)\n([^\n]+)\n([^\n]+)\n([^\n]+)\n([^\n]+)')
    matches = pattern.findall(content)

    movies = []
    for rank_str, title, raw_url, year_str, dur_str, cert, rat_vote_str in matches:
        rank = int(rank_str)
        tt_match = re.search(r'(tt\d+)', raw_url)
        imdb_id = tt_match.group(1) if tt_match else ''
        clean_url = f'https://www.imdb.com/title/{imdb_id}/' if imdb_id else raw_url
        year = int(year_str)
        dur_min = parse_duration(dur_str)
        
        rv_match = re.match(r'([\d\.]+)\s*\((.*?)\)', rat_vote_str)
        if rv_match:
            rating = float(rv_match.group(1))
            votes_str = rv_match.group(2)
            votes_count = parse_votes(votes_str)
        else:
            rating = None
            votes_str = ''
            votes_count = None

        movies.append({
            'rank': rank,
            'title': title,
            'imdb_id': imdb_id,
            'year': year,
            'duration': dur_str,
            'duration_minutes': dur_min,
            'certificate': cert,
            'rating': rating,
            'votes_display': votes_str,
            'votes_count': votes_count,
            'imdb_url': clean_url
        })

    # Save to JSON
    with open('imdb_top_250.json', 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)
    print(f'Saved {len(movies)} movies to imdb_top_250.json')

    # Save to CSV
    df = pd.DataFrame(movies)
    df.to_csv('imdb_top_250.csv', index=False, encoding='utf-8-sig')
    print('Saved to imdb_top_250.csv')

    # Save to Excel
    df.to_excel('imdb_top_250.xlsx', index=False, engine='openpyxl')
    print('Saved to imdb_top_250.xlsx')

    # Additional sections (news & explore charts)
    popular_charts = [
        {"name": "Top box office (US)", "description": "From the past weekend", "titles_count": 10, "url": "https://www.imdb.com/chart/boxoffice/"},
        {"name": "Most popular movies", "description": "As determined by IMDb users", "titles_count": 100, "url": "https://www.imdb.com/chart/moviemeter/"},
        {"name": "Top rated English movies", "description": "English-language movies as rated by IMDb users", "titles_count": 250, "url": "https://www.imdb.com/chart/top-english-movies/"},
        {"name": "Most popular TV shows", "description": "As determined by IMDb users", "titles_count": 100, "url": "https://www.imdb.com/chart/tvmeter/"},
        {"name": "Top 250 TV shows", "description": "Top 250 as rated by IMDb Users", "titles_count": 250, "url": "https://www.imdb.com/chart/toptv/"},
        {"name": "Lowest rated movies", "description": "Bottom 100 as voted by IMDb users", "titles_count": 100, "url": "https://www.imdb.com/chart/bottom/"},
        {"name": "Trending people", "description": "As determined by IMDb users", "titles_count": 100, "url": "https://www.imdb.com/chart/starmeter/"}
    ]

    movie_news = [
        {
            "headline": "One Of The Most Unsettling Movies Of The '60s Is A Must-Watch On HBO Max",
            "date": "11/21/2026",
            "author": "Joe Roberts",
            "outlet": "Slash Film",
            "url": "https://www.slashfilm.com/2317952/persona-60s-most-unsettling-movies-must-watch-hbo-max/"
        },
        {
            "headline": "Roger Ebert Preferred This Divisive 2007 Fantasy Movie Over The Lord Of The Rings",
            "date": "11/21/2026",
            "author": "Devin Meenan",
            "outlet": "Slash Film",
            "url": "https://www.slashfilm.com/2317922/roger-ebert-prefer-2007-fantasy-movie-over-lord-of-the-rings-the-golden-compass/"
        },
        {
            "headline": "Box Office: ‘The Hunger Games: Sunrise on the Reaping’ Scores $56 Million on Friday, ‘I Play Rocky’ Follows With $3.8 Million",
            "date": "11/21/2026",
            "author": "Payton Turkeltaub",
            "outlet": "Variety - Film News",
            "url": "https://variety.com/2026/film/box-office/box-office-hunger-games-sunrise-of-the-reaping-opening-day-1236954987/"
        },
        {
            "headline": "Nicolas Cage's Acclaimed '90s Neo Western Thriller Flop Is Worth Revisiting",
            "date": "11/21/2026",
            "author": "Jeremy Smith",
            "outlet": "Slash Film",
            "url": "https://www.slashfilm.com/2317782/nicolas-cage-90s-neo-western-thriller-flop-red-rock-west/"
        },
        {
            "headline": "5 Of The Best 4K Blu-Ray Black Friday Deals Under $20",
            "date": "11/21/2026",
            "author": "Ryan Scott",
            "outlet": "Slash Film",
            "url": "https://www.slashfilm.com/2322792/best-4k-blu-ray-black-friday-deals-under-20-dollars/"
        }
    ]

    insights = {
        "source": "https://www.imdb.com/chart/top/",
        "total_titles": len(movies),
        "average_imdb_rating": round(df['rating'].mean(), 2),
        "min_rating": df['rating'].min(),
        "max_rating": df['rating'].max(),
        "total_estimated_votes": int(df['votes_count'].sum()),
        "average_duration_minutes": round(df['duration_minutes'].mean(), 1),
        "oldest_movie": {"title": df.loc[df['year'].idxmin()]['title'], "year": int(df['year'].min())},
        "newest_movie": {"title": df.loc[df['year'].idxmax()]['title'], "year": int(df['year'].max())},
        "chart_rules": [
            "The top rated movie list only includes feature films.",
            "Shorts, TV movies, and documentaries are not included.",
            "The list is ranked by a formula which includes the number of ratings each movie received from users, and value of ratings received from regular users.",
            "To be included on the list, a movie must receive ratings from at least 25000 users."
        ],
        "popular_charts": popular_charts,
        "movie_news": movie_news
    }

    with open('chart_insights_and_news.json', 'w', encoding='utf-8') as f:
        json.dump(insights, f, indent=2, ensure_ascii=False)
    print('Saved chart insights and news to chart_insights_and_news.json')

if __name__ == '__main__':
    main()
