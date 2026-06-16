# 🦷 SmartDent — Plateforme de Gestion de Cabinet Dentaire

## Stack Technique
| Couche | Technologie |
|--------|-------------|
| Backend | Laravel 11 |
| Frontend | React.js 18 + Vite |
| Base de données | MySQL 8 |
| Auth | Laravel Sanctum |
| Rôles | Spatie Permission |
| Styling | Tailwind CSS |

## 🚀 Installation

### Prérequis
- PHP >= 8.2, Composer
- Node.js >= 18
- MySQL 8

### 1. Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```
Configurer `.env` (DB_DATABASE, DB_USERNAME, DB_PASSWORD), puis :
```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

### 2. Frontend (React)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Application disponible sur http://localhost:5173

## 👥 Comptes de test
| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@smartdent.com | password |
| Dentiste | dentiste@smartdent.com | password |
| Secrétaire | secretaire@smartdent.com | password |

## 📁 Structure
```
smartdent/
├── backend/   # API Laravel
└── frontend/  # Application React
```
