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

### Gebruikersauthenticatie
Gebruikers kunnen zich registreren en inloggen via de webinterface. De backend valideert gebruikersgegevens en beheert sessies. Wachtwoorden worden veilig opgeslagen met bcrypt hashing.
### Toekomstige Verbeteringen
- Ondersteuning voor meerdere temperatuursensoren
- Realtime notificaties via WebSockets
- Verbeterde gebruikersinterface met meer visualisaties 
- Uitbreiding van de API met meer functionaliteit
