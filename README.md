> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

# facilinow

A dashboard displaying the real-time status of public facilities in Fukui Prefecture, and a store locator map for the Genky drugstore chain.

> [!WARNING]
> The Fukui Prefecture Facility Dashboard (the main application) ceased operations on March 31, 2024.

## Demos

- **Fukui Facility Dashboard**: https://code4fukui.github.io/facilinow/
- **Genky Drugstore Map**: https://code4fukui.github.io/facilinow/genkymap.html

## Features

### Fukui Facility Dashboard (`index.html`)

- Displays the opening status (開館/閉館), congestion level, name, and hours for facilities in Fukui Prefecture in a tabular view.
- Automatically calculates the current open/closed status based on regular closing days, temporary closures, and Japanese national holidays.
- Provides links to each facility's official website and the source open data CSV.

### Genky Drugstore Map (`genkymap.html`)

- An interactive map showing the locations of Genky drugstores.
- Filter stores by prefecture using checkboxes.
- Displays a color-coded tabular map visualizing store density by municipality.
- Clickable map markers link to detailed store information pages.

## Usage

1.  Open the [Fukui Facility Dashboard](https://code4fukui.github.io/facilinow/) in your web browser.
2.  The table automatically loads and displays the current status of each facility.
3.  The "開館状況" (Opening Status) column shows "開館" (Open) or "閉館" (Closed) based on the current time.
4.  Click on a facility's name to