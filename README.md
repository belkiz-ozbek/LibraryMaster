# 📚 LibraryMaster - Modern Kütüphane Yönetim Sistemi

Modern React, TypeScript ve Express.js ile geliştirilmiş tam kapsamlı kütüphane yönetim sistemi. Kapsamlı kütüphane operasyonları, çoklu dil desteği ve gelişmiş analitik özellikleri ile birlikte gelir.

![LibraryMaster](https://img.shields.io/badge/LibraryMaster-v1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Express](https://img.shields.io/badge/Express-4.21.2-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC)

## ✨ Özellikler

### 📖 Kitap Yönetimi
- Detaylı bilgilerle kitap ekleme, düzenleme ve silme
- ISBN doğrulama ve tekrar önleme (opsiyonel)
- Mevcut ve toplam kopya takibi
- Başlık, yazar, tür veya ISBN ile arama ve filtreleme
- Kitap kategorilendirme ve raf yönetimi

### 👥 Üye Yönetimi
- Tam üye kaydı ve profil yönetimi
- Username ve email ile giriş sistemi
- E-posta doğrulama sistemi
- Üyelik tarihi takibi
- Üyeler için admin değerlendirmeleri ve notlar
- Üye ödünç alma geçmişi
- Üye arama ve filtreleme

### 🔄 Ödünç Alma Sistemi
- Kitap ödünç alma ve iade
- Otomatik son teslim tarihi hesaplama
- Uzatma talebi işlevselliği
- Gecikmiş kitap takibi
- İade tarihi yönetimi
- Ödünç alma durumu takibi (borrowed, returned, overdue)

### 📊 İstatistikler ve Analitik
- Anahtar metriklerle kapsamlı dashboard
- Ödünç alma istatistikleri ve trendler
- Üye aktivite raporları
- Kitap popülerlik analitikleri
- Gecikmiş kitap raporları
- En çok ödünç alınan kitaplar
- En aktif üyeler
- Aylık en çok okuyan üyeler

### 🌐 Çoklu Dil Desteği
- Türkçe ve İngilizce dil desteği
- Dinamik dil değiştirme
- Yerelleştirilmiş UI bileşenleri

### 🔐 Kimlik Doğrulama ve Güvenlik
- JWT tabanlı güvenli giriş sistemi
- E-posta doğrulama sistemi
- Oturum yönetimi
- Admin rol yönetimi
- Bcrypt ile şifre şifreleme
- Redis ile doğrulama token yönetimi

### 🎨 Modern UI/UX
- Tailwind CSS ile responsive tasarım
- Radix UI ile etkileşimli bileşenler
- Framer Motion ile akıcı animasyonlar
- Loading ekranları ve animasyonlar

## 🚀 Teknoloji Yığını

### Frontend
- **React 18** - UI framework
- **TypeScript** - Tip güvenliği
- **Vite** - Build tool ve dev server
- **Tailwind CSS** - Styling
- **Radix UI** - Erişilebilir bileşenler
- **React Query** - Veri çekme ve önbellekleme
- **Wouter** - Navigasyon (React Router yerine)
- **Framer Motion** - Animasyonlar
- **i18next** - Uluslararasılaştırma

### Backend
- **Express.js** - Web framework
- **TypeScript** - Tip güvenliği
- **Drizzle ORM** - Veritabanı ORM
- **PostgreSQL** - Veritabanı (Neon)
- **JWT** - Kimlik doğrulama
- **Express Session** - Oturum yönetimi
- **Zod** - Şema doğrulama
- **Redis** - Doğrulama token yönetimi
- **Nodemailer** - E-posta gönderimi

### Veritabanı
- **PostgreSQL** Neon üzerinde barındırılıyor
- **Drizzle Kit** - Veritabanı migrasyonları
- **Relations** - Uygun foreign key ilişkileri

## 📦 Kurulum

### Ön Gereksinimler
- Node.js 18+
- npm veya yarn
- PostgreSQL veritabanı (Neon önerilir)
- Redis (doğrulama token'ları için)

### Kurulum Adımları

1. **Repository'yi klonlayın**
   ```bash
   git clone https://github.com/belkiz-ozbek/LibraryMaster.git
   cd LibraryMaster
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Ortam Değişkenlerini Ayarlayın**
   Root dizinde `.env` dosyası oluşturun:
   ```env
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
   SESSION_SECRET=your-super-secret-session-key
   JWT_SECRET=your-jwt-secret-key
   REDIS_URL=redis://username:password@host:port
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   BACKEND_URL=https://your-app-domain.com
   ```

4. **Veritabanını Ayarlayın**
   ```bash
   # Veritabanı şemasını push edin
   npm run db:push
   ```

5. **Geliştirme Sunucusunu Başlatın**
   ```bash
   npm run dev
   ```

   Uygulama `http://localhost:3000` adresinde erişilebilir olacak

## 🏗️ Proje Yapısı

```
LibraryMaster/
├── client/                 # Frontend React uygulaması
│   ├── src/
│   │   ├── components/     # Yeniden kullanılabilir UI bileşenleri
│   │   │   ├── forms/     # Form bileşenleri
│   │   │   ├── layout/    # Layout bileşenleri
│   │   │   └── ui/        # UI bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── hooks/         # Özel React hook'ları
│   │   ├── lib/           # Yardımcı fonksiyonlar ve konfigürasyonlar
│   │   └── assets/        # Statik dosyalar
├── server/                # Backend Express uygulaması
│   ├── index.ts          # Sunucu giriş noktası
│   ├── routes.ts         # API rotaları
│   ├── db.ts            # Veritabanı konfigürasyonu
│   ├── storage.ts       # Veritabanı işlemleri
│   ├── emailService.ts  # E-posta servisi
│   ├── redis.ts         # Redis konfigürasyonu
│   └── types.ts         # TypeScript tipleri
├── shared/               # Frontend ve backend arasında paylaşılan kod
│   └── schema.ts        # Veritabanı şeması ve tipleri
├── migrations/           # Veritabanı migrasyonları
├── public/              # Statik dosyalar
└── drizzle.config.ts    # Drizzle konfigürasyonu
```

## 🗄️ Veritabanı Şeması

### Users Tablosu
- `id` - Primary key
- `name` - Kullanıcının tam adı
- `username` - Benzersiz kullanıcı adı
- `email` - E-posta adresi (opsiyonel)
- `password` - Şifrelenmiş parola (opsiyonel)
- `isAdmin` - Admin rol bayrağı
- `membershipDate` - Üyelik tarihi
- `adminRating` - Admin tarafından atanan puan
- `adminNotes` - Admin notları
- `emailVerified` - E-posta doğrulama durumu
- `emailVerificationToken` - E-posta doğrulama token'ı
- `emailVerificationExpires` - Token geçerlilik süresi

### Books Tablosu
- `id` - Primary key
- `title` - Kitap başlığı
- `author` - Kitap yazarı
- `isbn` - Benzersiz ISBN (opsiyonel)
- `genre` - Kitap türü
- `publishYear` - Yayın yılı
- `shelfNumber` - Fiziksel konum
- `availableCopies` - Mevcut kopyalar
- `totalCopies` - Toplam sahip olunan kopyalar
- `pageCount` - Sayfa sayısı
- `createdAt` - Sisteme eklenme tarihi

### Borrowings Tablosu
- `id` - Primary key
- `bookId` - Kitap referansı
- `userId` - Kullanıcı referansı
- `borrowDate` - Ödünç alma tarihi
- `dueDate` - Son teslim tarihi
- `returnDate` - İade tarihi
- `status` - ödünç_alındı/iade_edildi/gecikti
- `extensionRequested` - Uzatma talebi bayrağı
- `notes` - Ek notlar

## 🚀 Mevcut Scriptler

```bash
# Geliştirme
npm run dev          # Geliştirme sunucusunu başlat
npm run build        # Production için build
npm run start        # Production sunucusunu başlat

# Veritabanı
npm run db:push      # Şemayı veritabanına push et

# Tip kontrolü
npm run check        # TypeScript tip kontrolü
```

## 🌍 Ortam Değişkenleri

| Değişken | Açıklama | Gerekli |
|----------|----------|---------|
| `DATABASE_URL` | PostgreSQL bağlantı stringi | Evet |
| `SESSION_SECRET` | Oturum şifreleme için gizli anahtar | Evet |
| `JWT_SECRET` | JWT token şifreleme için gizli anahtar | Evet |
| `REDIS_URL` | Redis bağlantı stringi | Evet |
| `EMAIL_SERVICE` | E-posta servisi (gmail, outlook, vb.) | Evet |
| `BACKEND_URL` | Backend URL'i (e-posta doğrulama linkleri için) | Evet |
| `EMAIL_USER` | E-posta kullanıcı adı | Evet |
| `EMAIL_PASS` | E-posta şifresi | Evet |

## 🔧 Konfigürasyon

### Veritabanı Konfigürasyonu
Uygulama PostgreSQL ile Drizzle ORM kullanır. Veritabanı migrasyonları `drizzle-kit` ile otomatik olarak yönetilir.

### Kimlik Doğrulama
- JWT tabanlı kimlik doğrulama
- E-posta doğrulama sistemi
- Bcrypt ile parola şifreleme
- Admin rol yönetimi
- Redis ile doğrulama token yönetimi

### E-posta Servisi
- Nodemailer ile SMTP entegrasyonu
- E-posta doğrulama gönderimi
- Şifre sıfırlama e-postaları

### Uluslararasılaştırma
- Türkçe ve İngilizce desteği
- Dinamik dil değiştirme
- Yerelleştirilmiş tarih ve sayı formatlaması

## 📱 Detaylı Özellikler

### Dashboard
- Kapsamlı istatistikler
- Son aktiviteler
- Hızlı işlemler
- Sistem genel bakışı
- En çok ödünç alınan kitaplar
- En aktif üyeler

### Kitap Yönetimi
- Kitaplar için CRUD işlemleri
- Gelişmiş arama ve filtreleme
- Toplu işlemler
- ISBN doğrulama (opsiyonel)

### Üye Yönetimi
- Üye kaydı ve e-posta doğrulama
- Profil yönetimi
- Ödünç alma geçmişi
- Admin notları ve puanları
- Username ve email ile giriş

### Ödünç Alma Sistemi
- Ödünç alma süreci
- Son teslim tarihi yönetimi
- Uzatma talepleri
- İade işlemi
- Durum takibi

### Raporlar ve Analitik
- İstatistiksel genel bakış
- Trend analizi
- Üye aktivite raporları
- Kitap popülerlik analizi
- Gecikmiş kitap raporları

### Aktivite Takibi
- Sistem aktivite geçmişi
- Kullanıcı aktivite takibi
- Gerçek zamanlı bildirimler

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@belkiz-ozbek](https://github.com/belkiz-ozbek)

Proje Linki: [https://github.com/belkiz-ozbek/LibraryMaster](https://github.com/belkiz-ozbek/LibraryMaster)

## 🙏 Teşekkürler

- [React](https://reactjs.org/) - UI framework
- [Express.js](https://expressjs.com/) - Web framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI bileşenleri
- [Drizzle ORM](https://orm.drizzle.team/) - Veritabanı ORM
- [Neon](https://neon.tech/) - PostgreSQL hosting
- [Wouter](https://github.com/molefrog/wouter) - Routing

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın! 

# Railway Deploy Talimatı

## Build Komutu

```
cd client && npm install && npm run build && cd .. && npm run build
```

## Start Komutu

```
npm start
```

- Frontend build çıktısı otomatik olarak `dist/public` klasörüne yazılır.
- Express backend productionda bu klasörü serve eder.
- Tüm doğrulama ve yönlendirme linklerinde ana domaini kullanın: `https://libraryms-production.up.railway.app` 
