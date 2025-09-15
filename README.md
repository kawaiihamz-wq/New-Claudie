# Claudie AI Workspace

Claudie AI Workspace adalah aplikasi web modular yang menggabungkan berbagai model AI (GPT-4, Claude, Gemini) dalam satu interface yang elegan dan responsif. Aplikasi ini menyediakan workspace seperti kanvas dengan panel terpisah untuk chat dan output, dilengkapi dengan sistem autentikasi yang aman.

## ✨ Fitur Utama

### 🔐 Sistem Autentikasi
- **Registrasi & Login Pengguna**: Sistem registrasi dan login yang aman dengan JWT authentication
- **Hash Password**: Menggunakan bcrypt untuk enkripsi password yang aman
- **Validasi Email**: Validasi email terintegrasi untuk memastikan format email yang benar
- **Session Management**: Manajemen session otomatis dengan token authentication

### 🚀 Workspace Modular
- **Panel Split Layout**: Interface kanvas dengan dua panel utama
  - **Chat Panel (Kiri)**: Untuk percakapan dengan AI
  - **Output Panel (Kanan)**: Untuk menampilkan hasil konten yang dihasilkan
- **Responsive Design**: Desain modern yang responsif untuk semua ukuran layar
- **Sidebar Navigation**: Navigasi samping dengan manajemen percakapan

### 🤖 Multi-Model AI Support
- **Quick Model Switcher**: Tombol switching cepat di pojok kanan atas
- **Color-Coded Badges**: 
  - 🟢 **GPT-4** (OpenAI) - Hijau
  - 🟣 **Claude** (Anthropic) - Ungu  
  - 🔵 **Gemini** (Google) - Biru
- **Task Types**: Berbagai jenis tugas AI
  - 💬 General Chat
  - 👨‍💻 Code Assistant
  - 📝 Summarize & Review
  - 🎨 Image Generation (Interface Ready)
  - 🎬 Video Generation (Interface Ready)

### 💬 Advanced Chat Features
- **Real-time Streaming**: Respons AI secara real-time
- **Syntax Highlighting**: Highlighting kode otomatis
- **Message History**: Riwayat percakapan tersimpan per pengguna
- **Conversation Management**: CRUD operations untuk percakapan

### 🎨 Modern UI/UX
- **Tailwind CSS**: Desain modern dengan Tailwind CSS
- **Gradient Backgrounds**: Background gradient yang elegan
- **Smooth Animations**: Animasi halus dan interaktif
- **Loading States**: Status loading yang informatif
- **Form Validation**: Validasi form yang komprehensif

## 🛠 Tech Stack

### Backend
- **FastAPI**: Framework Python untuk API yang cepat dan modern
- **MongoDB**: Database NoSQL untuk penyimpanan data
- **Motor**: Driver async MongoDB untuk Python
- **JWT**: JSON Web Token untuk autentikasi
- **bcrypt**: Library untuk hashing password
- **Emergent LLM Integration**: Integrasi dengan berbagai model AI

### Frontend  
- **React 18**: Library JavaScript untuk UI
- **React Router**: Routing untuk SPA
- **Axios**: HTTP client untuk API calls
- **Tailwind CSS**: Framework CSS utility-first
- **Heroicons**: Icon library yang konsisten

### Infrastructure
- **Docker**: Containerization (opsional)
- **Supervisor**: Process management
- **Nginx**: Web server dan reverse proxy
- **Ubuntu**: Sistem operasi yang direkomendasikan

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB 7.0+
- Yarn package manager

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd claudie-ai-workspace
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd ../frontend
yarn install
```

4. **Environment Configuration**

Backend (.env):
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="claudie_workspace"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY="your-emergent-llm-key"
JWT_SECRET="your-jwt-secret-key"
```

Frontend (.env):
```bash
REACT_APP_BACKEND_URL="http://localhost:8001"
```

5. **Start Services**
```bash
# Start MongoDB
sudo systemctl start mongod

# Start Backend (Terminal 1)
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Start Frontend (Terminal 2)
cd frontend
yarn start
```

6. **Access Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Registrasi pengguna baru
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

#### POST /api/auth/login
Login pengguna
```json
{
  "email": "john@example.com",
  "password": "password123" 
}
```

#### GET /api/auth/me
Mendapatkan informasi pengguna saat ini (requires authentication)

### Chat Endpoints

#### POST /api/chat
Mengirim pesan ke AI
```json
{
  "message": "Hello, how can you help me?",
  "model": "openai",
  "model_name": "gpt-4o",
  "task_type": "general"
}
```

#### GET /api/conversations
Mendapatkan daftar percakapan pengguna

#### POST /api/conversations
Membuat percakapan baru

#### DELETE /api/conversations/{conversation_id}
Menghapus percakapan

## 🔧 Development

### Project Structure
```
claudie-ai-workspace/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── App.js        # Main App component
│   ├── package.json      # Node.js dependencies
│   └── .env             # Environment variables
├── install.md           # Ubuntu VPS installation guide
└── README.md           # This file
```

### Key Components

#### Backend Components
- `server.py`: Main FastAPI application dengan endpoint untuk autentikasi dan chat
- `User Models`: Model Pydantic untuk user management
- `Authentication`: JWT-based authentication system
- `Database Integration`: MongoDB integration dengan Motor

#### Frontend Components
- `AuthContext`: Context untuk manajemen state autentikasi
- `Auth Components`: Login dan Register form components
- `Workspace Components`: Layout modular untuk chat dan output
- `ModelSwitcher`: Component untuk switching antar model AI
- `ChatPanel & OutputPanel`: Komponen utama untuk interaksi AI

## 🔒 Security Features

- **JWT Authentication**: Token-based authentication yang aman
- **Password Hashing**: bcrypt untuk hashing password
- **Email Validation**: Validasi format email
- **CORS Configuration**: Konfigurasi CORS yang aman
- **Input Validation**: Validasi input di frontend dan backend
- **Protected Routes**: Route protection dengan authentication

## 🌐 Model AI Support

### Supported Models
- **OpenAI GPT Models**: gpt-4o, gpt-4o-mini, gpt-4, dll
- **Anthropic Claude**: claude-3-5-sonnet, claude-3-7-sonnet, dll  
- **Google Gemini**: gemini-2.0-flash, gemini-1.5-pro, dll

### Task Types
- **General Chat**: Percakapan umum dengan AI
- **Code Assistant**: Bantuan pemrograman dan debugging
- **Summarize**: Meringkas teks atau dokumen
- **Review**: Review dan analisis konten
- **Image Generation**: Generasi gambar (interface ready)
- **Video Generation**: Generasi video (interface ready)

## 📱 Responsive Design

Aplikasi ini sepenuhnya responsif dan mendukung:
- **Desktop**: Layout penuh dengan semua fitur
- **Tablet**: Layout yang dioptimalkan untuk layar medium
- **Mobile**: Interface mobile-friendly dengan overlay sidebar

## 🚀 Production Deployment

Untuk deployment production ke Ubuntu VPS, silakan ikuti panduan lengkap di file `install.md` yang mencakup:

- Setup Ubuntu VPS
- MongoDB installation dan konfigurasi
- Node.js dan Python setup
- Nginx configuration
- SSL certificate setup
- Process management dengan Supervisor
- Security hardening
- Monitoring dan backup strategies

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Cek dokumentasi di file `install.md`
2. Periksa logs aplikasi:
   - Backend logs: `/var/log/supervisor/backend.*.log`
   - Frontend logs: Browser developer console
3. Buat issue di repository GitHub

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Sistem autentikasi lengkap (registrasi, login, JWT)
- ✅ Workspace modular dengan split panel design
- ✅ Multi model AI support (GPT, Claude, Gemini)
- ✅ Real-time chat dengan streaming responses
- ✅ Modern responsive UI dengan Tailwind CSS
- ✅ Conversation management
- ✅ Complete Ubuntu VPS deployment guide

---

**Dibuat dengan ❤️ untuk memberikan pengalaman AI workspace yang terbaik**