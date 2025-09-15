#!/bin/bash

# Script untuk otomatis zip semua folder dan file di direktori saat ini
# menjadi 1 file zip, buat HTML installer, dan jalankan PHP server
# Oleh: Assistant

# Konfigurasi
CURRENT_DIR=$(pwd)
BACKUP_DIR="$CURRENT_DIR/backups"
WEB_DIR="$CURRENT_DIR/webinstaller"
PORT="8080"
LOG_FILE="$CURRENT_DIR/auto-backup.log"

# Warna untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fungsi log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Fungsi untuk menampilkan error
error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

# Fungsi untuk menampilkan success
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a $LOG_FILE
}

# Fungsi untuk menampilkan warning
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Fungsi untuk menampilkan info
info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a $LOG_FILE
}

# Header
echo "=========================================="
echo "AUTO BACKUP SCRIPT - 1 ZIP SEMUA FILE"
echo "Direktori: $CURRENT_DIR"
echo "=========================================="

# Buat direktori backup jika belum ada
mkdir -p $BACKUP_DIR || error "Gagal membuat direktori backup"
mkdir -p $WEB_DIR || error "Gagal membuat direktori web"

log "Memulai proses backup otomatis di: $CURRENT_DIR"

# Bersihkan backup lama (file zip lebih dari 7 hari)
find $BACKUP_DIR -name "*.zip" -mtime +7 -delete 2>/dev/null
log "Membersihkan backup lama (>7 hari)"

# Dapatkan nama folder untuk backup
folder_name=$(basename "$CURRENT_DIR")
timestamp=$(date +%Y%m%d_%H%M%S)
zip_name="${folder_name}_full_backup_${timestamp}.zip"
zip_path="$BACKUP_DIR/$zip_name"

# List semua file dan folder yang akan di-backup (kecuali backup dan webinstaller)
items_to_backup=$(find . -maxdepth 1 ! -name "." ! -name ".." ! -name "backups" ! -name "webinstaller" ! -name ".*" ! -name "*.log" | sed 's|^./||' | sort)

if [ -z "$items_to_backup" ]; then
    warning "Tidak ada file atau folder yang ditemukan di direktori ini"
    echo "File/folder yang ada:"
    ls -la
    exit 0
fi

log "File/folder yang akan di-backup:"
echo "$items_to_backup"

info "Membuat 1 zip file berisi semua file dan folder..."
echo "Nama file: $zip_name"

# Pattern untuk exclude file/folder tertentu
exclude_patterns=(
    "*/node_modules/*"
    "*/vendor/*" 
    "*/cache/*"
    "*/tmp/*"
    "*.log"
    "*.tmp"
    "backups/*"
    "webinstaller/*"
    "*.zip"
    "*.tar.gz"
)

# Build exclude string untuk zip
exclude_string=""
for pattern in "${exclude_patterns[@]}"; do
    exclude_string+=" -x \"$pattern\""
done

# Zip semua file dan folder menjadi 1 file
echo "Proses zipping (mungkin beberapa saat)..."
zip -r $zip_path . \
    -x "node_modules/*" \
    -x "vendor/*" \
    -x "cache/*" \
    -x "tmp/*" \
    -x "*.log" \
    -x "*.tmp" \
    -x "backups/*" \
    -x "webinstaller/*" \
    -x "*.zip" \
    -x "*.tar.gz" \
    -x ".*" 2>/dev/null

if [ $? -eq 0 ]; then
    file_size=$(du -h $zip_path | cut -f1)
    file_count=$(zipinfo -1 $zip_path | wc -l)
    success "Backup berhasil dibuat!"
    success "File: $zip_name"
    success "Size: $file_size"
    success "Jumlah file: $file_count"
else
    error "Gagal membuat backup zip"
fi

# Buat file HTML installer
log "Membuat HTML installer..."

cat > $WEB_DIR/index.html << EOF
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Full Backup Installer - $(hostname)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        .server-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
        }
        
        .backup-card {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            text-align: center;
        }
        
        .backup-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .download-btn {
            display: inline-block;
            background: #fff;
            color: #007bff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 50px;
            margin-top: 20px;
            font-weight: bold;
            font-size: 1.2em;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .file-list {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .file-item {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
            font-family: monospace;
            font-size: 14px;
        }
        
        .command-box {
            background: #1a1a1a;
            color: #00ff00;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
        }
        
        .note {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📦 Full Backup Installer</h1>
            <p>Backup lengkap dari direktori: <strong>$CURRENT_DIR</strong></p>
        </header>
        
        <div class="server-info">
            <strong>Server:</strong> $(hostname) | 
            <strong>IP:</strong> $(hostname -I | cut -d' ' -f1) | 
            <strong>Waktu:</strong> $(date '+%d-%m-%Y %H:%M:%S')
        </div>
        
        <div class="backup-card">
            <h2>✅ Backup Berhasil Dibuat!</h2>
            <p>Semua file dan folder telah dikompilasi menjadi 1 file zip</p>
            
            <div class="backup-info">
                <div class="info-item">
                    <h3>📁 Nama File</h3>
                    <p>$zip_name</p>
                </div>
                <div class="info-item">
                    <h3>📊 Size</h3>
                    <p>$file_size</p>
                </div>
                <div class="info-item">
                    <h3>🔢 Jumlah File</h3>
                    <p>$file_count files</p>
                </div>
            </div>
            
            <a href='/backups/$zip_name' class='download-btn'>⬇️ Download Full Backup</a>
        </div>
        
        <div class="note">
            <strong>💡 Informasi:</strong> File zip ini berisi <strong>SEMUA</strong> file dan folder 
            dari direktori saat ini (kecuali file temporary dan cache).
        </div>
        
        <h3>📋 Daftar File yang Di-backup:</h3>
        <div class="file-list">
            $(zipinfo -1 $zip_path | head -50 | while read file; do echo "<div class='file-item'>📄 $file</div>"; done)
            $(if [ $file_count -gt 50 ]; then echo "<div class='file-item'>... dan $(($file_count - 50)) file lainnya</div>"; fi)
        </div>
        
        <div class="command-box">
            # Command untuk extract backup:<br>
            unzip $zip_name<br><br>
            
            # Atau untuk melihat isi zip:<br>
            unzip -l $zip_name<br><br>
            
            # Untuk extract ke folder tertentu:<br>
            unzip $zip_name -d target_folder
        </div>
        
        <div class="note">
            <strong>⚠️ Perhatian:</strong> Simpan backup di lokasi yang aman. 
            File ini berisi semua data dari direktori ini.
        </div>
        
        <footer>
            <p>Generated by Auto Backup Script • $(date +%Y) • $(hostname)</p>
        </footer>
    </div>
</body>
</html>
EOF

success "HTML installer berhasil dibuat: $WEB_DIR/index.html"

# Buat symlink dari webinstaller/backups ke backups directory
ln -sf $BACKUP_DIR $WEB_DIR/backups 2>/dev/null

# Buat file info.txt tentang backup
cat > $BACKUP_DIR/backup_info.txt << EOF
Backup Information
==================
Tanggal: $(date)
Direktori: $CURRENT_DIR
File Backup: $zip_name
Size: $file_size
Jumlah File: $file_count
Server: $(hostname)

File yang di-exclude:
- node_modules/
- vendor/
- cache/
- tmp/
- *.log
- *.tmp
- backups/
- webinstaller/
- File hidden (.*)

Command extract:
unzip $zip_name
EOF

# Cek jika PHP tersedia untuk server
if command -v php &> /dev/null; then
    log "Menjalankan PHP server di port $PORT..."
    echo "=========================================="
    echo "🚀 PHP Server berjalan di:"
    echo "URL: http://$(hostname -I | cut -d' ' -f1):$PORT"
    echo "URL: http://localhost:$PORT"
    echo "=========================================="
    echo "📦 Download backup dari: http://localhost:$PORT/backups/$zip_name"
    echo "=========================================="
    echo "Tekan Ctrl+C untuk menghentikan server"
    echo "=========================================="
    
    # Jalankan PHP server di background
    cd $WEB_DIR
    php -S 0.0.0.0:$PORT
    
elif command -v python3 &> /dev/null; then
    log "PHP tidak ditemukan, menggunakan Python server..."
    cd $WEB_DIR
    python3 -m http.server $PORT
else
    warning "Tidak ditemukan PHP atau Python untuk menjalankan server"
    echo "Anda bisa mengakses file di: $WEB_DIR"
    echo "File backup: $BACKUP_DIR/$zip_name"
fi
