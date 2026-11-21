import json
import os

def generate():
    with open('imdb_top_250.json', 'r', encoding='utf-8') as f:
        movies = json.load(f)

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IMDb Top 250 Movies with Posters</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d0f12;
            color: #e5e7eb;
            margin: 0;
            padding: 24px;
        }
        .container {
            max-width: 1440px;
            margin: 0 auto;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 24px;
            border-bottom: 1px solid #27272a;
            padding-bottom: 20px;
        }
        h1 {
            margin: 0;
            color: #f5c518;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .subtitle {
            color: #9ca3af;
            font-size: 14px;
            margin-top: 6px;
        }
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 14px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 14px 18px;
        }
        .stat-val {
            font-size: 22px;
            font-weight: 700;
            color: #f5c518;
        }
        .stat-lbl {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }
        .search-box {
            background: #18181b;
            border: 1px solid #3f3f46;
            border-radius: 8px;
            padding: 10px 16px;
            color: #fff;
            font-size: 14px;
            width: 320px;
            outline: none;
            transition: border-color 0.2s;
        }
        .search-box:focus {
            border-color: #f5c518;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #18181b;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #27272a;
        }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #27272a;
            font-size: 14px;
            vertical-align: middle;
        }
        th {
            background-color: #1f2127;
            color: #9ca3af;
            font-weight: 600;
            user-select: none;
            cursor: pointer;
            white-space: nowrap;
        }
        th:hover {
            color: #f5c518;
        }
        tr:hover td {
            background-color: #212329;
        }
        .rank {
            font-weight: 700;
            color: #9ca3af;
            width: 50px;
            text-align: center;
        }
        .poster-cell {
            width: 65px;
            padding: 6px 12px;
        }
        .poster-img {
            width: 48px;
            height: 72px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #3f3f46;
            background-color: #27272a;
            display: block;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .poster-img:hover {
            transform: scale(2.2);
            z-index: 100;
            position: relative;
            box-shadow: 0 8px 24px rgba(0,0,0,0.8);
        }
        .title-cell a {
            color: #ffffff;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
        }
        .title-cell a:hover {
            color: #f5c518;
            text-decoration: underline;
        }
        .rating-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-weight: 700;
            color: #f5c518;
            font-size: 15px;
        }
        .star {
            color: #f5c518;
        }
        .badge {
            background: #27272a;
            color: #d4d4d8;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div>
            <h1>IMDb Top 250 Movies</h1>
            <div class="subtitle">Complete scraped dataset with official posters, runtime, certificates, and ratings</div>
        </div>
        <input type="text" id="search" class="search-box" placeholder="Search title, year, certificate, rating..." onkeyup="filterTable()">
    </header>

    <div class="stats-bar">
        <div class="stat-card"><div class="stat-val">250</div><div class="stat-lbl">Total Movies</div></div>
        <div class="stat-card"><div class="stat-val">8.31</div><div class="stat-lbl">Average Rating</div></div>
        <div class="stat-card"><div class="stat-val">9.3</div><div class="stat-lbl">Top Rating</div></div>
        <div class="stat-card"><div class="stat-val">133 min</div><div class="stat-lbl">Average Duration</div></div>
        <div class="stat-card"><div class="stat-val">195.6M</div><div class="stat-lbl">Estimated Total Votes</div></div>
    </div>

    <table id="moviesTable">
        <thead>
            <tr>
                <th onclick="sortTable(0, true)">#</th>
                <th>Poster</th>
                <th onclick="sortTable(2, false)">Title</th>
                <th onclick="sortTable(3, true)">Year</th>
                <th onclick="sortTable(4, true)">Runtime</th>
                <th onclick="sortTable(5, false)">Certificate</th>
                <th onclick="sortTable(6, true)">Rating</th>
                <th onclick="sortTable(7, true)">Votes</th>
                <th>IMDb Link</th>
            </tr>
        </thead>
        <tbody>
"""

    for m in movies:
        poster_src = m.get('local_poster_path') or m.get('poster_url') or ''
        img_tag = f'<img src="{poster_src}" class="poster-img" alt="{m["title"]}" loading="lazy">' if poster_src else '<div style="width:48px;height:72px;background:#27272a;border-radius:4px;"></div>'

        html += f"""            <tr>
                <td class="rank">#{m['rank']}</td>
                <td class="poster-cell">{img_tag}</td>
                <td class="title-cell"><a href="{m['imdb_url']}" target="_blank">{m['title']}</a></td>
                <td>{m['year']}</td>
                <td data-val="{m['duration_minutes']}">{m['duration']}</td>
                <td><span class="badge">{m['certificate']}</span></td>
                <td data-val="{m['rating']}"><span class="rating-badge"><span class="star">&#9733;</span> {m['rating']}</span></td>
                <td data-val="{m['votes_count']}">{m['votes_display']}</td>
                <td><a href="{m['imdb_url']}" target="_blank" style="color:#f5c518; text-decoration:none; font-weight:500;">View &rarr;</a></td>
            </tr>\n"""

    html += """        </tbody>
    </table>
</div>

<script>
function filterTable() {
    let input = document.getElementById('search');
    let filter = input.value.toLowerCase();
    let tr = document.getElementById('moviesTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
        let text = tr[i].textContent || tr[i].innerText;
        tr[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
    }
}

function sortTable(n, isNum) {
    let table = document.getElementById('moviesTable');
    let tbody = table.getElementsByTagName('tbody')[0];
    let rows = Array.from(tbody.rows);
    let asc = table.getAttribute('data-sort-dir-' + n) !== 'asc';
    
    rows.sort((a, b) => {
        let cellA = a.cells[n];
        let cellB = b.cells[n];
        let valA = cellA.getAttribute('data-val') || cellA.innerText.replace('#', '').trim();
        let valB = cellB.getAttribute('data-val') || cellB.innerText.replace('#', '').trim();
        if (isNum) {
            return asc ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA);
        } else {
            return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
    });

    table.setAttribute('data-sort-dir-' + n, asc ? 'asc' : 'desc');
    rows.forEach(r => tbody.appendChild(r));
}
</script>
</body>
</html>"""

    with open('imdb_top_250.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Generated updated imdb_top_250.html with posters')

if __name__ == '__main__':
    generate()
