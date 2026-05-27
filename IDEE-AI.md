# Possibili evoluzioni AI — Il Gazzettino

Analisi concreta, senza stime vaghe. Prezzi basati su Claude API (Haiku per uso leggero, Sonnet per qualità alta).

---

## 1. Confronto fonti sulla stessa storia

**Come funziona**: quando 3+ feed coprono la stessa notizia (già deduplicata), un bottone invia titoli + descrizioni di tutte le versioni a Claude che evidenzia differenze di tono e omissioni.

**Costo**: ~100–600 token input + ~300 output per confronto
- Haiku: ≈ €0.002/confronto → €0.30/mese con 5 confronti/giorno
- Sonnet: ≈ €0.01/confronto → €1.50/mese

**Pro**: on-demand (paga solo se lo usi), contesto piccolo, valore altissimo — è l'unica feature che nessun aggregatore ha nel tuo stack personale.

**Contro**: richiede di modificare `deduplicate()` per conservare le fonti scartate invece di buttarle — altrimenti i duplicati sono già persi. Piccolo refactor.

---

## 2. Auto-suggest argomenti da evitare

**Come funziona**: dopo ogni refresh, Claude analizza i titoli caricati e propone keyword da aggiungere ai filtri.

**Costo**: ~3.000 token input (tutti i titoli) + ~200 output
- Haiku: ≈ €0.003/analisi → €0.25/mese con 3 refresh/giorno

**Pro**: economicissimo, utile per utenti nuovi che non sanno cosa filtrare.

**Contro**: rischio di suggerire di filtrare argomenti che in realtà interessano; se fatto automaticamente ad ogni refresh diventa rumore; valore basso nel tempo perché dopo qualche settimana i filtri sono già stabili.

**Verdetto**: da fare solo su richiesta esplicita, non automaticamente.

---

## 3. Brief giornaliero "cosa non ti sei perso"

**Come funziona**: on-demand, Claude riceve tutti gli articoli del giorno e produce 5–8 righe sui fatti rilevanti basati sui tuoi feed.

**Costo**: ~15.000 token input (150 articoli × titolo+descrizione) + ~500 output
- Haiku: ≈ €0.014/brief → €0.42/mese (1×/giorno)
- Sonnet: ≈ €0.055/brief → €1.65/mese

**Pro**: risparmia tempo reale; personale al 100% perché usa solo le tue fonti.

**Contro**: gli articoli attuali esistono solo in memoria React — chiudi il browser e spariscono. Servirebbe o localStorage degli articoli o forzare un refresh prima del brief. Con feed lenti o con molti articoli il contesto può gonfiarsi.

**Verdetto**: fattibile con Haiku a costo bassissimo, ma richiede persistence degli articoli.

---

## 4. Domande sulle notizie caricate

**Come funziona**: chat contestuale — Claude risponde usando solo gli articoli visibili, con prompt esplicito che vieta di inventarsi fatti.

**Costo**: ~18.000 token input (articoli + domanda + system prompt) + ~500 output
- Haiku: ≈ €0.016/domanda → €2.40/mese con 5 domande/giorno
- Sonnet: ≈ €0.065/domanda → €9/mese

**Pro**: la più potente; trasforma la lettura passiva in ricerca attiva; differenzia davvero il prodotto.

**Contro**: la più costosa se si usa Sonnet con uso intensivo; richiede una UI di chat; con 200+ articoli il contesto sale — soluzione: mandare solo i 30–40 più recenti o più rilevanti per la domanda.

---

## Tabella riassuntiva

| | Costo/mese (uso normale) | Complessità | Valore unico |
|---|---|---|---|
| 1. Confronto fonti | €0.30–1.50 | Media | ★★★★★ |
| 2. Auto-suggest filtri | €0.25 | Bassa | ★★☆☆☆ |
| 3. Brief giornaliero | €0.40–1.70 | Media | ★★★☆☆ |
| 4. Domande | €2–9 | Alta | ★★★★★ |

**Consiglio pratico**: 1 e 4 insieme sono la combinazione più differenziante e costano meno di un caffè al mese con Haiku. La 2 la farei solo on-demand. La 3 dipende da quanto serve la persistenza degli articoli.
