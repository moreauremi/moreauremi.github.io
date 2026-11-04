---
# Traduction anglaise de crypto-dashboard-pro.md. Seuls les champs traduits
# sont ici (titre, resume, statut) : les autres viennent du fichier français.
titre: "Crypto Dashboard Pro"
statut: "completed"
resume: "Interactive real-time dashboard to track the price of six cryptocurrencies, with a custom alert system: Python, Streamlit and the CoinGecko API."
---

## Context

[À COMPLÉTER : pourquoi ce projet, pour qui, avec quels moyens]

## Objectives

Track the price of a cryptocurrency in real time, sum it up in key indicators, and get an alert as soon as the price goes above a chosen threshold.

## Implementation

The application is written in **Python** with **Streamlit**, a framework that turns a Python script into a web application.

- **Data**: the public **CoinGecko** API (free, no key) provides the price in euros of six cryptocurrencies: Bitcoin, Ethereum, Dogecoin, Solana, Cardano and XRP. Requests go through the Requests library.
- **Caching**: each API response is kept for 30 seconds, to stay within its limit of about 50 requests per minute and to speed up the display.
- **Refresh**: manual with a button, or automatic every 60 seconds.
- **History**: the prices collected are kept during the session and processed with **Pandas**; the history starts again from zero when you switch cryptocurrency.
- **Key performance indicators (KPIs)**: current price, change since the start of the session (in euros and as a percentage), highest and lowest.
- **Chart**: an interactive **Plotly** line chart of the price, with the alert threshold line.
- **Alert**: when the price goes above the threshold set by the user, a notification appears with a "sell signal" message; otherwise, the remaining gap below the threshold is shown.
- **Error handling**: a timeout, a network error or invalid data display a clear message instead of stopping the application.

Source code (MIT licence): [github.com/moreauremi/crypto-dashboard-pro](https://github.com/moreauremi/crypto-dashboard-pro)

## Screenshots

Screenshots taken on 25 September 2026, with real CoinGecko data: eight Bitcoin price readings over about four minutes. The application's interface is in French.

![Bitcoin dashboard: "stable price" message, four indicators and a line of eight readings below the dotted threshold line](captures/crypto-dashboard-pro/tableau-de-bord.webp "Price below the alert threshold: session indicators and price chart, with the threshold as a red dotted line")

![Alert threshold lowered below the price: red "sell signal" banner and notification in the top right corner](captures/crypto-dashboard-pro/alerte-seuil.webp "Threshold exceeded: “sell signal” message and alert notification")

![Detailed history table: time and price of each reading, from most recent to oldest](captures/crypto-dashboard-pro/historique.webp "Detailed history of the session's readings")

## Results and testing

The project is completed; its code was published on GitHub in January 2026.

[À COMPLÉTER : ce qui a été vérifié (actualisation, alertes, comportement sans réseau…), et comment]

## Difficulties encountered

[À COMPLÉTER : problèmes rencontrés et solutions trouvées]

## Possible improvements

- Track more cryptocurrencies, and compare them with one another
- Export the data to CSV or Excel
- Show the price over several periods (1 hour, 24 hours, 7 days)
- Send alerts by e-mail or Telegram
- Add technical indicators (RSI, MACD)

## Skills applied

- Python development (Streamlit, Pandas)
- Using a REST API (CoinGecko) and handling network errors
- Data visualisation (Plotly)
