# Cal.com Setup-Anleitung für Stefan

**Ziel:** ImpactFlow-Branding + E-Mail-Konfiguration für Cal.com einrichten.
**Aufwand:** Ca. 20-30 Minuten, einmalig.
**Danach:** Jean Pierre pflegt die CSS/JS-Dateien, du machst nur noch `git pull`.

---

## Was passiert hier?

Nginx injiziert bei jeder Cal.com-Seite zwei Dateien:
- `custom.css` — Design-Anpassungen (Farben, Layout, Elemente ausblenden)
- `custom.js` — Textänderungen und dynamische Anpassungen

Cal.com selbst wird NICHT verändert. Updates sind kein Problem.

---

## Schritt 1: Dateien auf den Server kopieren

```bash
# Ordner erstellen
sudo mkdir -p /opt/calcom-branding

# Dateien kopieren (per SCP von Jean Pierres Mac)
# ODER: Git-Repo klonen (empfohlen)
cd /opt
sudo git clone <REPO-URL> calcom-branding
```

**Empfehlung Git:** So kann Jean Pierre Änderungen pushen und du machst nur:
```bash
cd /opt/calcom-branding && git pull
```

---

## Schritt 2: Nginx-Konfiguration anpassen

Finde den Nginx Server-Block für `erfolg-calcom.peaknetworks.cloud` und füge folgendes ein:

```nginx
server {
    server_name erfolg-calcom.peaknetworks.cloud;

    # --- BESTEHENDE CONFIG (proxy_pass etc.) ---

    # === ImpactFlow Custom Branding START ===

    # CSS/JS Dateien statisch ausliefern
    location /custom-branding/ {
        alias /opt/calcom-branding/;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # CSS + JS in jede HTML-Antwort injizieren
    sub_filter '</head>' '<link rel="stylesheet" href="/custom-branding/custom.css" />\n<script src="/custom-branding/custom.js" defer></script>\n</head>';
    sub_filter_once on;
    sub_filter_types text/html;

    # WICHTIG: Damit sub_filter mit proxy_pass funktioniert
    proxy_set_header Accept-Encoding "";

    # === ImpactFlow Custom Branding ENDE ===
}
```

**Wichtig:** Die Zeile `proxy_set_header Accept-Encoding "";` muss VOR dem `proxy_pass` stehen. Sie verhindert, dass Nginx komprimierte Antworten bekommt (die kann sub_filter nicht verarbeiten).

---

## Schritt 3: Nginx testen und neu laden

```bash
# Syntax prüfen
sudo nginx -t

# Wenn OK: Neu laden (kein Neustart nötig)
sudo nginx -s reload
```

---

## Schritt 4: Testen

Öffne im Browser:
1. `https://erfolg-calcom.peaknetworks.cloud/custom-branding/custom.css`
   → Sollte die CSS-Datei anzeigen
2. `https://erfolg-calcom.peaknetworks.cloud/termin/30min`
   → Quellcode prüfen (Rechtsklick > Seitenquelltext): Vor `</head>` sollten die CSS/JS-Links stehen

---

## Schritt 5: SMTP + E-Mail-Konfiguration (WICHTIG)

Wir steuern die Kunden-E-Mails (Terminbestätigung, Erinnerungen, Stornierung) über unser eigenes System (Quentn via n8n). Cal.com soll nur noch System-E-Mails senden (Passwort-Reset, Account-Einladungen).

### 5a) SMTP einrichten

In der Cal.com `.env` Datei hinzufügen:
```env
EMAIL_FROM="Impact Flow <go@impactflow.ch>"
SMTP_HOST=asmtp.mail.hostpoint.ch
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=go@impactflow.ch
SMTP_PASSWORD=<separat per E-Mail erhalten>
```

### 5b) Buchungs-E-Mails von Cal.com deaktivieren

Cal.com soll KEINE Buchungs-E-Mails an Kunden senden (kein Doppelversand). Das machen wir über Quentn.

Prüfe, ob diese Umgebungsvariable in der `.env` funktioniert:
```env
# Buchungs-E-Mails deaktivieren (Bestätigung, Stornierung, Umbuchung)
# System-Mails (Passwort-Reset, Einladungen) bleiben aktiv
NEXT_PUBLIC_DISABLE_BOOKING_EMAILS=true
```

Falls diese Variable bei eurer Cal.com-Version nicht greift, gib Jean Pierre kurz Bescheid — dann lösen wir es anders.

### 5c) Nach der Änderung

```bash
# Cal.com Container neu starten damit .env-Änderungen greifen
docker compose down && docker compose up -d
```

### Was danach passiert

| E-Mail-Typ | Gesendet von | Status |
|---|---|---|
| Passwort-Reset | Cal.com (SMTP) | ✅ Funktioniert |
| Account-Einladungen | Cal.com (SMTP) | ✅ Funktioniert |
| Termin-Bestätigung | Quentn (unser System) | ✅ Kein Handlungsbedarf |
| Erinnerung vor Termin | Quentn (unser System) | ✅ Kein Handlungsbedarf |
| Stornierung/Umbuchung | Quentn (unser System) | ✅ Kein Handlungsbedarf |

---

## Spätere Updates

Wenn Jean Pierre Änderungen an CSS/JS macht:

```bash
cd /opt/calcom-branding
git pull
# Fertig — Nginx liefert sofort die neuen Dateien aus
# Kein Nginx-Reload nötig (nur Dateien, kein Config-Change)
```

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| CSS/JS nicht geladen | Prüfe: `curl https://erfolg-calcom.peaknetworks.cloud/custom-branding/custom.css` |
| sub_filter greift nicht | `proxy_set_header Accept-Encoding "";` fehlt |
| Änderungen nicht sichtbar | Browser-Cache leeren (Ctrl+Shift+R) oder `expires` kürzer setzen |
| Nginx -t Fehler | Klammern/Semikolons in der Config prüfen |
| Kunden bekommen doppelte E-Mails | `NEXT_PUBLIC_DISABLE_BOOKING_EMAILS=true` in .env prüfen + Container neu starten |
| Passwort-Reset geht nicht | SMTP-Konfiguration in .env prüfen (Host, Port, Zugangsdaten) |

---

**Fragen?** Einfach Jean Pierre fragen — er weiss, was die Dateien machen.
