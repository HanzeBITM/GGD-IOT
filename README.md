# GGD-IOT Project - Temperatuurmonitoringssysteem

## Overzicht

Dit project is een temperatuurmonitoringssysteem dat bestaat uit twee hoofdcomponenten:
1. Een Flask backend server (`app.py`) die communiceert met IoT temperatuursensoren
2. Een Next.js frontend applicatie voor het weergeven van temperatuurgegevens, configuratie en waarschuwingen

Het systeem monitort temperatuurmetingen van PICO W sensoren, slaat de gegevens op in een PostgreSQL database, verstuurt waarschuwingen via Telegram wanneer temperaturen de geconfigureerde drempels overschrijden, en toont realtime informatie op een webdashboard.

## Projectstructuur
```plaintext
GGD-IOT/
├── app/                                # Next.js applicatiebestanden
│   ├── api/                            # API routes voor Next.js
│   │   └── settings/
│   │       └── thresholds/             # API routes voor temperatuurdrempels
│   │           └── route.ts            # GET/PUT endpoints voor drempelinstellingen
│   ├── login/                          # Inlogpagina
│   │   └── page.tsx                    # Inlogformulier
│   ├── register/                       # Registratiepagina
│   │   └── page.tsx                    # Registratieformulier
│   ├── layout.tsx                      # Hoofdlayout component
│   └── page.tsx                        # Hoofddashboard pagina
├── components/                         # Herbruikbare React componenten
│   ├── ui/                             # UI componenten (shadcn/ui)
│   │   ├── alert.tsx                   # Waarschuwing component
│   │   ├── button.tsx                  # Knop component
│   │   ├── card.tsx                    # Kaart component
│   │   ├── dialog.tsx                  # Dialoog component
│   │   ├── input.tsx                   # Invoer component
│   │   ├── label.tsx                   # Label component
│   │   ├── slider.tsx                  # Schuifregelaar component
│   │   ├── switch.tsx                  # Schakelaar component
│   │   ├── table.tsx                   # Tabel component
│   │   ├── tabs.tsx                    # Tabbladen component
│   │   └── tooltip.tsx                 # Tooltip component
│   ├── connection-status.tsx           # Verbindingsstatus component
│   ├── temperature-display.tsx         # Temperatuurweergave component
│   ├── temperature-line-chart.tsx      # Temperatuurgrafiek component
│   ├── temperature-settings.tsx        # Temperatuurinstellingen component
│   └── time-range-filter.tsx           # Tijdbereikfilter component
├── lib/                                # Hulpfuncties en bibliotheken
│   └── db.tsx                          # Database hulpprogramma's
├── app.py                              # Flask backend server
└── README.md                           # Projectdocumentatie
``` 

## Kerncomponenten

### Backend (Flask)

Het `app.py` bestand fungeert als de backend voor de applicatie en biedt de volgende functionaliteiten:

1. **Temperatuurgegevensverzameling**: Ontvangt temperatuurgegevens van IoT-sensoren via HTTP POST-verzoeken
2. **Databasebeheer**: Slaat temperatuurmetingen op in een PostgreSQL-database
3. **Waarschuwingssysteem**: Verstuurt waarschuwingen via Telegram wanneer temperaturen drempelwaarden overschrijden
4. **Gebruikersauthenticatie**: Beheert gebruikersregistratie en -login
5. **API-eindpunten**: Biedt API-eindpunten voor de frontend om gegevens op te halen en instellingen te wijzigen
6. **Verbindingsmonitoring**: Bewaakt sensorverbindingen en verstuurt waarschuwingen wanneer verbindingen verbroken zijn

Belangrijke eindpuntroutes:
- `/temperature` (POST): Temperatuurmetingen ontvangen
- `/temperature/history` (GET): Historische temperatuurgegevens ophalen
- `/settings/thresholds` (GET/PUT): Temperatuurdrempels ophalen of bijwerken
- `/auth/register` (POST): Gebruikersregistratie
- `/auth/login` (POST): Gebruikersinloggen
- `/status` (GET): Serverstatus
- `/check_connection` (GET): Sensorverbindingsstatus controleren

### Frontend (Next.js)

De frontend biedt een gebruiksvriendelijke interface voor het monitoren van temperatuurgegevens:

1. **Dashboard**: Realtime temperatuurmonitoring met visuele indicatoren
2. **Temperatuurgeschiedenis**: Grafieken en tabellen met historische temperatuurgegevens
3. **Instellingen**: Temperatuurdrempels configureren
4. **Gebruikersauthenticatie**: Login- en registratiefunctionaliteit
5. **Waarschuwingen**: Visuele waarschuwingen voor temperatuurafwijkingen en verbindingsproblemen

## Aan de slag

### Vereisten

1. Python 3.8 of hoger
2. Node.js 18 of hoger
3. pnpm (of npm/yarn)
4. PostgreSQL database

### Backend Setup

1. Installeer Python-afhankelijkheden:
   ```bash
   pip install flask requests psycopg2-binary bcrypt flask-cors
    ```
2. Configureer de PostgreSQL database en maak een `.env` bestand aan met de volgende variabelen:

# Update deze waarden in app.py
```plaintext
PGHOST = "jouw-db-host"
PGDATABASE = "jouw-db-naam"
PGUSER = "jouw-db-gebruiker"
PGPASSWORD = "jouw-db-wachtwoord"
DB_PORT = 5432

TELEGRAM_BOT_TOKEN = "jouw-telegram-bot-token"
TELEGRAM_CHAT_ID = "jouw-telegram-chat-id"
```
3. Start de Flask server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigeer naar de `app` map:
   ```bash
   cd app
   ```
2. Installeer de frontend afhankelijkheden:
   ```bash
    pnpm install
    ```
3. Start de Next.js server:
    ```bash
    pnpm dev
    ```
4. Open de applicatie in je browser op `http://localhost:3000`


### Temperatuursensor Configuratie
Het systeem is ontworpen om te werken met PICO W microcontrollers die temperatuurgegevens naar het /temperature eindpunt sturen. Sensoren moeten:

Temperatuurmetingen verzamelen
HTTP POST-verzoeken sturen naar http://[server-ip]:5000/temperature met JSON-gegevens:

```json
{
    "temperature": 22.5,
}
```

### Temperatuurdrempels
```plaintext
Het systeem heeft twee configureerbare temperatuurdrempels:

Hoge Drempel (standaard: 28°C): Activeert waarschuwingen wanneer de temperatuur deze waarde overschrijdt
Lage Drempel (standaard: 20°C): Activeert waarschuwingen wanneer de temperatuur onder deze waarde daalt
Deze drempels kunnen worden aangepast via de webinterface in de Configuratiesectie of via directe API-aanroepen naar /settings/thresholds.
```

### Waarschuwingen
Wanneer de temperatuurmetingen de ingestelde drempels overschrijden, worden er waarschuwingen verstuurd via Telegram. De bot stuurt een bericht naar de opgegeven chat ID met details over de afwijking.
### Verbindingsstatus
De applicatie controleert regelmatig de verbinding met de temperatuursensoren. Als een sensor niet reageert, wordt er een waarschuwing verstuurd via Telegram.
### Database Schema
De PostgreSQL database bevat de volgende tabellen:
- `temperatures`: Slaat temperatuurmetingen op met tijdstempel, sensor ID en temperatuurwaarde
- `users`: Beheert gebruikersaccounts met inloggegevens en rollen

### Database Initialisatie
Voer de volgende SQL-commando's uit om de database te initialiseren:

```sql
CREATE TABLE IF NOT EXISTS temperatures (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(50) NOT NULL,
    temperature FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### GGD-IOT Project - Temperatuurmonitoringssysteem
### Installatie en Configuratie
1. Zorg ervoor dat de PostgreSQL database draait en toegankelijk is.
2. Maak de database en tabellen aan zoals hierboven beschreven.
3. Configureer de Flask backend met de juiste database- en Telegram-instellingen in het `.env` bestand.
4. Start de Flask server en de Next.js frontend zoals beschreven in de secties hierboven.
### Beveiliging
De applicatie maakt gebruik van bcrypt voor het hashen van wachtwoorden en implementeert basis beveiligingsmaatregelen zoals CORS-beperkingen en inputvalidatie. Zorg ervoor dat de server alleen toegankelijk is via HTTPS in een productieomgeving.
### Gebruikersinterface
De frontend is gebouwd met Next.js en biedt een responsieve gebruikersinterface. Belangrijke pagina's zijn:
- **Dashboard**: Toont realtime temperatuurmetingen en waarschuwingen
- **Instellingen**: Voor het configureren van temperatuurdrempels en gebruikersinstellingen
- **Login/Registratie**: Voor gebruikersauthenticatie

### API Documentatie
De API biedt de volgende eindpunten:
- `POST /temperature`: Ontvangt temperatuurmetingen van sensoren
- `GET /temperature/history`: Haalt historische temperatuurgegevens op
- `GET /settings/thresholds`: Haalt de huidige temperatuurdrempels op
- `PUT /settings/thresholds`: Wijzigt de temperatuurdrempels
- `POST /auth/register`: Registreert een nieuwe gebruiker
- `POST /auth/login`: Logt een gebruiker in en retourneert een sessie token
- `GET /status`: Retourneert de serverstatus
- `GET /check_connection`: Controleert de verbindingsstatus van sensoren

### Installatievereisten
- Python 3.8 of hoger

- Node.js 18 of hoger
- pnpm (of npm/yarn)
- PostgreSQL database
- Flask, psycopg2-binary, bcrypt, requests, flask-cors Python pakketten
- Next.js en shadcn/ui voor de frontend

### Installatie Stappen
1. Installeer de vereiste Python-pakketten met `pip install -r requirements.txt`.
2. Installeer de vereiste Node.js pakketten in de `app` map met `pnpm install`.
3. Configureer de PostgreSQL database en maak een `.env` bestand aan met de juiste instellingen.
4. Start de Flask backend server met `python app.py`.
5. Start de Next.js frontend applicatie met `pnpm dev` in de `app` map.

### Belangrijke Notities
- Zorg ervoor dat de PostgreSQL database toegankelijk is voor de Flask backend.
- De Telegram bot moet geconfigureerd zijn met de juiste token en chat ID om waarschuwingen te kunnen versturen.

### Gebruikersauthenticatie
Gebruikers kunnen zich registreren en inloggen via de webinterface. De backend valideert gebruikersgegevens en beheert sessies. Wachtwoorden worden veilig opgeslagen met bcrypt hashing.

### Toekomstige Verbeteringen
- Ondersteuning voor meerdere temperatuursensoren
- Realtime notificaties via WebSockets
- Verbeterde gebruikersinterface met meer visualisaties 
- Uitbreiding van de API met meer functionaliteit
