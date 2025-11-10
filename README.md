🌐 B2C Admin Panel

The B2C Admin Panel is a role-based web dashboard built for managing agents and monitoring case activity. It includes secure authentication, agent management, case management, and automated PDF report generation — all inside a modern and responsive React + Vite + Tailwind UI.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.x or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.x or higher) or **yarn** (v1.22.x or higher)
- **Git** - [Download here](https://git-scm.com/)
- A code editor (VS Code recommended)

---

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/your-username/b2c-admin-panel.git
```

### Step 2: Navigate to Project Directory

```bash
cd b2c-admin-panel
```

### Step 3: Install Dependencies

Choose your preferred package manager:

**Using npm:**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

This will install all required dependencies listed in `package.json`.

---

## ⚙️ Environment Configuration

### Step 4: Create Environment File

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Or manually create `.env` and add the following variables:

```env
VITE_API_BASE=https://rakshitjan-cps-b2c.hf.space/api
REACT_APP_APP_NAME=b2c-admin-panel
```

> **Note:** Update these values according to your backend API configuration.

---

## 🚀 Running the Application

### Step 5: Start Development Server

**Using npm:**
```bash
npm start
```

**Using yarn:**
```bash
yarn start
```

The application will automatically open in your browser at:
```
http://localhost:3000
```

---

## 🏗️ Building for Production

### Step 6: Create Production Build

**Using npm:**
```bash
npm run build
```

**Using yarn:**
```bash
yarn build
```

This creates an optimized production build in the `build/` directory.

### Step 7: Serve Production Build Locally (Optional)

Install serve globally:
```bash
npm install -g serve
```

Then serve the build:
```bash
serve -s build
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the app in development mode |
| `npm test` | Launches the test runner |
| `npm run build` | Builds the app for production |
| `npm run eject` | Ejects from Create React App (irreversible) |


## 🔧 Troubleshooting

### Common Issues and Solutions

**Port 3000 is already in use:**
```bash
# Kill the process on port 3000
npx kill-port 3000
```

**Module not found errors:**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Permission errors on Mac/Linux:**
```bash
# Use sudo (not recommended) or fix npm permissions
sudo npm install
```

---

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🎯 Quick Start Summary

```bash
# Clone the repo
git clone https://github.com/your-username/b2c-admin-panel.git

# Navigate to directory
cd b2c-admin-panel

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm start
```

**That's it! You're ready to start developing! 🎉**



🚀 Tech Stack:
| Layer                 | Technology              |
| --------------------- | ----------------------- |
| Frontend              | React.js + Vite ⚡       |
| Styling               | Tailwind CSS 🎨         |
| State & API           | Fetch / Context / Hooks |
| Backend               | Private API             |
| Authentication        | Email + Password        |
| Environment Variables | `.env`                  |
| File Upload           | CSV (Bulk Case Upload)  |
| PDF Generation        | Case Report PDF Viewer  |

🔐 Login Credentials:
| Field        | Value                  |
| ------------ | ---------------------- |
| **Email**    | `admin123@example.com` |
| **Password** | `SecurePass123`        |

🔑 Environment Setup:-
VITE_API_BASE=https://rakshitjan-cps-b2c.hf.space/api
-which is in .env file of my root directory

## ✨ Features

### ✅ Authentication
- Email + password login  
- Secure session handling  
- Redirect to dashboard upon successful login  

Login Page Image:

<img width="1919" height="991" alt="Screenshot 2025-11-03 164203" src="https://github.com/user-attachments/assets/781445b3-42bb-473e-a64a-16163899901f" />

### 👨‍💼 Agent Management
- View list of agents in table format  
- View agent details (Name, Email, Phone, Status)  
- Edit agent button available in each row  
- **Add New Agent** button above the table to add a new agent  

Agent Management Dashboard Images :

<img width="1897" height="975" alt="Screenshot 2025-11-03 164243" src="https://github.com/user-attachments/assets/bc7e2247-75ae-4923-b562-eabc5e1acae0" />

<img width="1907" height="982" alt="Screenshot 2025-11-03 164302" src="https://github.com/user-attachments/assets/8081ae4b-8ee3-4b08-a2b8-e061f190f776" />

<img width="1901" height="986" alt="Screenshot 2025-11-03 164316" src="https://github.com/user-attachments/assets/4c47d59a-1aa5-40e5-9f53-5212bebca7c1" />



### 📁 Case Management
- Case statistics overview:
  - ✅ Total cases  
  - ⏳ Pending cases  
  - 📦 Completed cases  
- Cases displayed in table format  
- View case details  
- **View Report** button in every case row to access PDF report  
- **Upload CSV** (Excel) button to bulk upload cases  

Case Management Dasboard Images:

<img width="1917" height="987" alt="Screenshot 2025-11-03 164334" src="https://github.com/user-attachments/assets/405a7c48-263f-462b-87e6-cee5d913ac85" />

<img width="1919" height="986" alt="Screenshot 2025-11-03 164351" src="https://github.com/user-attachments/assets/9936593c-15f4-410d-b503-3f3bb3cc3414" />

<img width="1919" height="989" alt="Screenshot 2025-11-03 164414" src="https://github.com/user-attachments/assets/f4ca0b9d-a0e0-48da-81c3-20e85747e41e" />

### 🧾 PDF Report Preview
- One-click PDF report view  
- PDF opens inside the UI (embedded viewer)  
- Easy preview without downloading  

<img width="1919" height="987" alt="Screenshot 2025-11-03 164608" src="https://github.com/user-attachments/assets/330acf26-f209-494e-ac59-a0e8019ead66" />

### 🔗 API Integration
- All API calling functions are organized in a separate services layer  
- You can find all API call files here: Rootfolder/src/services


