# Il Gazzettino 📰

Aggregatore di notizie personalizzato. Crea profili tematici o geografici e consulta il tuo gazzettino aggiornato.

## Funzionalità

- Profili multipli con keyword, categoria, paese, lingua e intervallo temporale
- Notizie dalle ultime 24 o 72 ore tramite GNews API
- Contatore utilizzo giornaliero (max 100 richieste/giorno sul piano free)
- Dati persistenti in localStorage

## Setup

```bash
npm install
cp .env.example .env.local
# Inserisci la tua API key in .env.local
npm run dev
```

Registrati su [gnews.io](https://gnews.io) per ottenere la chiave gratuita.

## Produzione

Per pubblicare l'app aggiungi un backend proxy che nasconda la chiave API.
Le chiamate a GNews non devono essere esposte nel bundle frontend.

## Stack

- React 18 + Vite
- GNews API (free tier: 100 req/day)
