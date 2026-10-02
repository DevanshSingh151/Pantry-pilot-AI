# PantryPilot AI 🥦

PantryPilot AI is a modern, intelligent SaaS application designed to help you manage your pantry, reduce food waste, and automatically generate smart recipes and insights using Artificial Intelligence.

## 🚀 Features

*   **Beautiful Modern UI**: Built with React, Tailwind CSS, and Lucide Icons for a clean, premium, food-management aesthetic.
*   **Smart Dashboard**: Provides high-level analytics, low-stock warnings, and AI-driven insights directly on the homepage.
*   **Inventory Management**: Track quantities, units, and categories (Produce, Dairy & Eggs, Meat & Seafood, Bakery, etc.) of all your items.
*   **Automated Expiry Tracking**: Automatically visualizes items that are fresh, expiring soon (≤ 7 days), or expired.
*   **AI Recipe Recommendations (Groq)**: Analyzes your expiring and expired ingredients to dynamically generate personalized recipes using Groq's high-speed API (powered by `gpt-oss-120b`).
*   **AI Grocery Bill Analysis (Gemini Vision)**: Upload a photo of your grocery receipt, and the app uses Gemini Vision AI (`gemini-2.5-flash`) to automatically extract the items, quantities, and units, allowing you to save them to your pantry in one click.
*   **Shopping List**: Integrated shopping list that warns you when items fall below your custom minimum stock levels.

## 🛠️ Tech Stack

### Frontend
*   **React 18** (Vite)
*   **React Router** for navigation
*   **Tailwind CSS** for responsive, modern styling
*   **Lucide React** for beautiful iconography
*   **Axios** for API requests

### Backend
*   **FastAPI** (Python 3.11)
*   **SQLAlchemy** with SQLite (Local) / MySQL (Production)
*   **Groq SDK** for text-based AI Insights & Recipes
*   **Google Generative AI SDK** for Vision-based Bill Extraction
*   **Python-Multipart** for handling image file uploads

### Cloud & AWS Infrastructure (When Deployed)
This project is designed to be fully deployable to AWS using `boto3` infrastructure-as-code automation.
*   **EC2**: Hosts the Nginx web server (Frontend) and Uvicorn server (FastAPI Backend).
*   **RDS**: Private MySQL database instance storing pantry data.
*   **S3**: Used for storing uploaded grocery bill images securely.
*   **Lambda & EventBridge**: Cron jobs for daily expiry checks and backend maintenance.
*   **SNS**: Simple Notification Service for sending email alerts when items are expiring.
*   **IAM**: Secure roles and instance profiles ensuring the principle of least privilege.

## ⚙️ Setup & Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/PantryPilot.git
cd PantryPilot
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create a .env file with your API keys
echo "GEMINI_API_KEY=your_gemini_key" > .env
echo "GROQ_API_KEY=your_groq_key" >> .env

# Start the FastAPI server (Runs on http://localhost:8000)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite development server (Runs on http://localhost:5173)
npm run dev
```

## ☁️ AWS Deployment

The project includes custom Python deployment scripts (`deploy_infra.py` and `deploy_app.py`) that fully automate provisioning and deploying the application to AWS. 

1. Ensure your AWS CLI is configured with valid credentials (`aws configure`).
2. Run `python deploy_infra.py` to provision EC2, RDS, SNS, Lambda, and S3.
3. Wait for RDS to become available (approx. 5-8 minutes).
4. Run `python inject_secrets.py` to push database credentials and AI API keys to the EC2 instance securely.
5. Run `python deploy_app.py` to package the React frontend and FastAPI backend, transfer them via SCP, install dependencies on the EC2 instance, and restart the Nginx/Systemd services.

*To avoid AWS charges, you can instantly tear down all resources by running `python teardown.py`.*
