from flask import Flask, request, jsonify
import requests
import time
import threading
from datetime import datetime
import psycopg2
import bcrypt
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Temperature Configuration
TEMP_THRESHOLD_HIGH = 28  # Bovengrens temperatuur
TEMP_THRESHOLD_LOW = 20  # Ondergrens temperatuur
TEMP_THRESHOLD = TEMP_THRESHOLD_HIGH  # For compatibility with database version

# Telegram Configuration
TELEGRAM_BOT_TOKEN = "8054704152:AAE-ZG87C3XaCQLQPbADod9kppN6KVrbMKs"
TELEGRAM_CHAT_ID = "-1002601590806"

# Database configuration
PGHOST = "ep-shy-glitter-a2hoqg38-pooler.eu-central-1.aws.neon.tech"
PGDATABASE = "neondb"
PGUSER = "neondb_owner"
PGPASSWORD = "npg_qYvBVlm4ZI6k"
DB_PORT = 5432
MAX_RETRIES = 3

# Variabelen om spam berichten te voorkomen
last_high_warning_time = 0
last_low_warning_time = 0
last_connection_lost_time = 0
COOLDOWN_PERIOD = 60  # 1 minuut cooldown tussen berichten
CONNECTION_TIMEOUT = 20  # 20 secondes timeout voor verbindingsverlies

# Houd bij wanneer we voor het laatst data hebben ontvangen
last_data_received = None  # Start met None in plaats van time.time()
connection_was_lost = False  # Track of verbinding verloren was
first_data_received = False  # Track of we ooit data hebben ontvangen

# Thread lock voor thread-safe toegang tot variabelen
data_lock = threading.Lock()


# Database Functions
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(
            host=PGHOST,
            database=PGDATABASE,
            user=PGUSER,
            password=PGPASSWORD,
            port=DB_PORT,
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise


def init_db():
    """Initialize database schema with proper error handling"""
    for attempt in range(MAX_RETRIES):
        try:
            conn = get_db_connection()
            cur = conn.cursor()

            # Create temperature_readings table if it doesn't exist
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS temperature_readings (
                    id SERIAL PRIMARY KEY,
                    temperature FLOAT NOT NULL,
                    warning BOOLEAN NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            # Create users table if it doesn't exist
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            """
            )

            # Verify tables were created successfully
            cur.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'temperature_readings')"
            )
            temp_table_exists = cur.fetchone()[0]

            cur.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
            )
            users_table_exists = cur.fetchone()[0]

            if temp_table_exists and users_table_exists:
                print("Database tables exist or were created successfully")
            else:
                print("Failed to create one or more tables")

            conn.commit()
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print(
                f"Database initialization error (attempt {attempt+1}/{MAX_RETRIES}): {e}"
            )
            if attempt < MAX_RETRIES - 1:
                time.sleep(1)  # Wait before retrying
            else:
                print("Failed to initialize database after multiple attempts")
                return False


# Telegram Functions
def send_telegram_message(message):
    """
    Stuurt een bericht naar de Telegram chat
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}

    try:
        response = requests.post(url, json=data, timeout=10)
        response.raise_for_status()
        print("Telegram bericht verzonden:", message)
        return True
    except Exception as e:
        print(f"Fout bij verzenden Telegram bericht: {e}")
        return False


def check_connection_status():
    """
    Controleert of er recent data is ontvangen
    """
    global last_connection_lost_time, connection_was_lost, last_data_received, first_data_received

    # Thread-safe toegang tot de variabelen
    with data_lock:
        current_time = time.time()

        # Als we nog nooit data hebben ontvangen, geen verbindingsfout
        if last_data_received is None:
            return True

        time_since_last_data = current_time - last_data_received
        current_connection_status = connection_was_lost

    # Als er meer dan CONNECTION_TIMEOUT seconden geen data is ontvangen
    if time_since_last_data > CONNECTION_TIMEOUT:
        # Stuur alleen een bericht als verbinding net verloren is (niet als het al verloren was)
        if not current_connection_status:
            with data_lock:
                # Double-check binnen de lock om race conditions te voorkomen
                if not connection_was_lost:
                    # Converteer de laatste data ontvangst tijd naar een leesbare tijd
                    last_data_time = datetime.fromtimestamp(last_data_received)
                    formatted_time = last_data_time.strftime("%H:%M:%S")

                    message = f"🔴 <b>VERBINDING VERLOREN!</b>\n"
                    message += f"Geen temperatuurdata ontvangen sinds: <b>{formatted_time}</b>\n"
                    message += f"⚠️ Controleer de microcontroller verbinding!"

                    if send_telegram_message(message):
                        last_connection_lost_time = current_time
                        connection_was_lost = True  # Markeer dat verbinding verloren is
        return False
    else:
        # Verbinding is weer actief - maar herstel wordt al afgehandeld in temperature endpoint
        if current_connection_status:
            with data_lock:
                # Reset alleen de status als die nog niet gereset is
                if connection_was_lost:
                    connection_was_lost = False
        return True


def background_connection_monitor():
    """
    Achtergrond thread die periodiek de verbindingsstatus controleert
    """
    while True:
        check_connection_status()
        time.sleep(30)  # Controleer elke 30 seconden


# User Authentication Endpoints
@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        # Validate input
        if not username or not email or not password:
            return jsonify({"error": "Username, email, and password are required"}), 400

        # Check if username or email already exists
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT * FROM users WHERE username = %s OR email = %s", (username, email)
        )
        existing_user = cur.fetchone()

        if existing_user:
            cur.close()
            conn.close()
            return jsonify({"error": "Username or email already exists"}), 409

        # Hash the password before storing
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Store new user
        cur.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id",
            (username, email, hashed_password.decode("utf-8")),
        )

        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return (
            jsonify(
                {
                    "message": "User registered successfully",
                    "user": {"id": user_id, "username": username, "email": email},
                }
            ),
            201,
        )

    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        # Validate input
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        # Find user by username
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, username, password FROM users WHERE username = %s", (username,)
        )
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid credentials"}), 401

        # Check password
        user_id, username, hashed_password = user

        if not bcrypt.checkpw(
            password.encode("utf-8"), hashed_password.encode("utf-8")
        ):
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid credentials"}), 401

        # Update last login time
        cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_id,))
        conn.commit()

        cur.close()
        conn.close()

        # In a real application, you might generate a JWT token here
        return jsonify(
            {
                "message": "Login successful",
                "user": {"id": user_id, "username": username},
            }
        )

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500


# Temperature Endpoints
@app.route("/temperature", methods=["POST"])
def temperature():
    global last_high_warning_time, last_low_warning_time, last_data_received, connection_was_lost, first_data_received

    # Thread-safe update van de laatste data ontvangst tijd
    with data_lock:
        last_data_received = time.time()
        was_connection_lost = connection_was_lost
        is_first_time = not first_data_received

        # Markeer dat we voor het eerst data hebben ontvangen
        if not first_data_received:
            first_data_received = True

        # Check of verbinding net hersteld is (maar niet bij eerste keer)
        if was_connection_lost and not is_first_time:
            current_time_formatted = datetime.fromtimestamp(
                last_data_received
            ).strftime("%H:%M:%S")
            message = f"✅ <b>VERBINDING HERSTELD!</b>\n"
            message += f"Temperatuurdata wordt weer ontvangen sinds: <b>{current_time_formatted}</b>\n"
            message += f"🔗 Microcontroller is weer verbonden!"

            # Reset de verbindingsstatus VOOR het versturen van het bericht
            connection_was_lost = False

    # Stuur herstel bericht buiten de lock om blocking te voorkomen (maar niet bij eerste keer)
    if was_connection_lost and not is_first_time:
        send_telegram_message(message)

    data = request.json
    temperature_value = data.get("temperature", None)

    if temperature_value is None:
        return (
            jsonify({"error": "Geen temperatuurgegevens verstrekt"}),
            400,
        )

    print(f"Ontvangen temperatuur: {temperature_value:.2f}°C")

    current_time = time.time()
    warning = False
    message_parts = []

    # Controleer hoge temperatuur
    if temperature_value > TEMP_THRESHOLD_HIGH:
        if current_time - last_high_warning_time > COOLDOWN_PERIOD:
            message = f"🌡️ <b>TEMPERATUUR TE HOOG!</b>\n\n"
            message += f"Huidige temperatuur: <b>{temperature_value:.1f}°C</b>\n"
            message += f"Bovengrens: <b>{TEMP_THRESHOLD_HIGH}°C</b>\n\n"
            message += f"🔥 Temperatuur is te hoog!"

            if send_telegram_message(message):
                last_high_warning_time = current_time

        warning = True
        message_parts.append(f"Temperatuur te hoog ({temperature_value:.1f}°C)")

    # Controleer lage temperatuur
    elif temperature_value < TEMP_THRESHOLD_LOW:
        if current_time - last_low_warning_time > COOLDOWN_PERIOD:
            message = f"❄️ <b>TEMPERATUUR TE LAAG!</b>\n\n"
            message += f"Huidige temperatuur: <b>{temperature_value:.1f}°C</b>\n"
            message += f"Ondergrens: <b>{TEMP_THRESHOLD_LOW}°C</b>\n\n"
            message += f"🧊 Temperatuur is te laag!"

            if send_telegram_message(message):
                last_low_warning_time = current_time

        warning = True
        message_parts.append(f"Temperatuur te laag ({temperature_value:.1f}°C)")

    # Normale temperatuur
    else:
        message_parts.append(f"Temperatuur is normaal ({temperature_value:.1f}°C)")

    response = {
        "warning": warning,
        "message": ", ".join(message_parts)
        + (" - LED aan" if warning else " - LED uit"),
        "temperature": temperature_value,
        "high_threshold": TEMP_THRESHOLD_HIGH,
        "low_threshold": TEMP_THRESHOLD_LOW,
    }

    # Store data in the database
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO temperature_readings (temperature, warning) VALUES (%s, %s)",
            (temperature_value, warning),
        )

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        # Continue execution even if database operation fails
        response["db_warning"] = "Data not saved to database"

    return jsonify(response)


@app.route("/temperature/history", methods=["GET"])
def get_temperature_history():
    # Optional query parameters for filtering
    limit = request.args.get("limit", 100, type=int)  # Default to last 100 readings
    hours = request.args.get("hours", 24, type=int)  # Default to last 24 hours

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT temperature, warning, timestamp 
            FROM temperature_readings 
            WHERE timestamp > NOW() - INTERVAL '%s hours'
            ORDER BY timestamp DESC
            LIMIT %s
            """,
            (hours, limit),
        )

        readings = cur.fetchall()

        # Convert to list of dictionaries for JSON response
        result = []
        for reading in readings:
            result.append(
                {
                    "temperature": reading[0],
                    "warning": reading[1],
                    "timestamp": reading[2].isoformat(),
                }
            )

        cur.close()
        conn.close()

        return jsonify(result)
    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500


# Add this new endpoint after your existing endpoints


@app.route("/settings/thresholds", methods=["GET", "PUT"])
def thresholds():
    """
    Endpoint om de temperatuur drempelwaarden op te halen of te wijzigen
    """
    global TEMP_THRESHOLD_HIGH, TEMP_THRESHOLD_LOW, TEMP_THRESHOLD

    if request.method == "GET":
        return jsonify(
            {"high_threshold": TEMP_THRESHOLD_HIGH, "low_threshold": TEMP_THRESHOLD_LOW}
        )

    elif request.method == "PUT":
        data = request.json
        new_high = data.get("high_threshold")
        new_low = data.get("low_threshold")

        # Validate input
        if new_high is not None and new_low is not None:
            if new_high <= new_low:
                return (
                    jsonify({"error": "Bovengrens moet hoger zijn dan ondergrens"}),
                    400,
                )

            # Update thresholds
            TEMP_THRESHOLD_HIGH = float(new_high)
            TEMP_THRESHOLD_LOW = float(new_low)
            TEMP_THRESHOLD = TEMP_THRESHOLD_HIGH  # Update compatibility variable

            # Log changes
            print(
                f"Temperatuur drempelwaarden gewijzigd - Hoog: {TEMP_THRESHOLD_HIGH}°C, Laag: {TEMP_THRESHOLD_LOW}°C"
            )

            # You might want to persist these changes to a configuration file or database
            # For now, they will be reset when the server restarts

            return jsonify(
                {
                    "message": "Temperatuur drempelwaarden bijgewerkt",
                    "high_threshold": TEMP_THRESHOLD_HIGH,
                    "low_threshold": TEMP_THRESHOLD_LOW,
                }
            )
        else:
            return jsonify({"error": "Beide drempelwaarden zijn vereist"}), 400


@app.route("/check_connection", methods=["GET"])
def check_connection():
    """
    Endpoint om handmatig de verbindingsstatus te controleren
    """
    status = check_connection_status()
    return jsonify(
        {
            "connection": "active" if status else "lost",
            "last_data": last_data_received,
            "current_time": time.time(),
            "first_data_received": first_data_received,
        }
    )


@app.route("/status", methods=["GET"])
def status():
    """
    Endpoint om de status van de server te controleren
    """
    connection_active = True
    if last_data_received is not None:
        connection_active = time.time() - last_data_received < CONNECTION_TIMEOUT
    else:
        connection_active = "waiting_for_first_data"

    return jsonify(
        {
            "status": "online",
            "high_threshold": TEMP_THRESHOLD_HIGH,
            "low_threshold": TEMP_THRESHOLD_LOW,
            "last_high_warning": last_high_warning_time,
            "last_low_warning": last_low_warning_time,
            "last_data_received": last_data_received,
            "connection_status": connection_active,
            "first_data_received": first_data_received,
        }
    )


if __name__ == "__main__":
    print("Flask server gestart...")
    print(f"Temperatuur bovengrens: {TEMP_THRESHOLD_HIGH}°C")
    print(f"Temperatuur ondergrens: {TEMP_THRESHOLD_LOW}°C")
    print(f"Telegram Bot Token: {TELEGRAM_BOT_TOKEN[:10]}...")
    print(f"Telegram Chat ID: {TELEGRAM_CHAT_ID}")

    # Initialize the database
    db_initialized = init_db()
    if not db_initialized:
        print(
            "WARNING: Application starting without successful database initialization"
        )
    else:
        print("Database successfully initialized")

    print("Wachten op eerste temperatuurdata...")

    # Start achtergrond thread voor verbindingsmonitoring
    monitor_thread = threading.Thread(target=background_connection_monitor, daemon=True)
    monitor_thread.start()
    print("Verbindingsmonitor gestart...")

    app.run(host="0.0.0.0", port=5000, debug=True)
