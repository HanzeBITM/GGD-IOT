from flask import Flask, request, jsonify
import psycopg2
from datetime import datetime
from flask_cors import CORS
import time
import bcrypt

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

TEMP_THRESHOLD = 28

# Database configuration
PGHOST = "ep-shy-glitter-a2hoqg38-pooler.eu-central-1.aws.neon.tech"
PGDATABASE = "neondb"
PGUSER = "neondb_owner"
PGPASSWORD = "npg_qYvBVlm4ZI6k"
DB_PORT = 5432

# Max retries for database connection
MAX_RETRIES = 3


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


# Initialize database before starting the app
db_initialized = init_db()
if not db_initialized:
    print("WARNING: Application starting without successful database initialization")


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
    data = request.json
    temperature = data.get("temperature", None)

    if temperature is None:
        return jsonify({"error": "Geen temperatuurgegevens verstrekt"}), 400

    warning = temperature > TEMP_THRESHOLD

    response = {
        "warning": warning,
        "message": (
            "Temperatuur te hoog! Zet LED aan."
            if warning
            else "Temperatuur is normaal. LED is uit."
        ),
    }

    # Store data in the database
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO temperature_readings (temperature, warning) VALUES (%s, %s)",
            (temperature, warning),
        )

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")
        # Continue execution even if database operation fails
        return jsonify({**response, "db_warning": "Data not saved to database"}), 200

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
