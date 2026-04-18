# 🚀 Arslan Panel | Ürün Yönetim Sistemi

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-AI_Powered-412991?style=for-the-badge&logo=openai)](https://openai.com/)

**Arslan Panel**, Arslan ailesine özel olarak tasarlanmış, Ticimax altyapısıyla tam entegre çalışan, yapay zeka destekli gelişmiş bir ürün yönetim platformudur.

---

## ✨ Öne Çıkan Özellikler

- 🤖 **AI Destekli İçerik:** OpenAI entegrasyonu ile otomatik ürün açıklamaları ve SEO optimizasyonu.
- 🔄 **Ticimax Senkronizasyonu:** SOAP API üzerinden anlık stok, fiyat ve ürün güncelleme.
- 📦 **Tedarikçi Yönetimi:** Farklı tedarikçilerden gelen verileri merkezi bir panelden yönetme ve senkronize etme.
- 🏷️ **Akıllı SKU ve Barkod:** Özelleştirilebilir kurallarla dinamik SKU ve barkod oluşturma sistemi.
- 🧹 **Hızlı Temizlik:** Tek tıkla ürün silme (Wipe) ve veritabanı optimizasyonu.
- 📂 **Kategori Yönetimi:** Ticimax kategorileri ile yerel veritabanı arasında akıllı eşleştirme.
- 🎨 **Modern Arayüz:** Tailwind CSS 4 ve Framer Motion ile güçlendirilmiş, akıcı ve premium kullanıcı deneyimi.

---

## 🛠️ Teknoloji Yığını

| Alan | Teknoloji |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Stil** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Backend/DB** | [Firebase & Cloud Firestore](https://firebase.google.com/) |
| **Yapay Zeka** | [OpenAI API](https://openai.com/) |
| **Animasyon** | [Framer Motion](https://www.framer.com/motion/) |
| **İkonlar** | [Lucide React](https://lucide.dev/) |
| **Test** | [Vitest](https://vitest.dev/) |

---

## 🚀 Başlangıç

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullanici/arslan-panel.git
cd arslan-panel/ticimax-panel
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env.local` dosyasını oluşturun ve gerekli anahtarları ekleyin:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
OPENAI_API_KEY=your_openai_key
TICIMAX_USER_CODE=your_code
# ... diğer ayarlar
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## 📁 Proje Yapısı

```text
src/
├── app/            # Next.js App Router (sayfalar ve API rotaları)
├── components/     # UI bileşenleri (layout, product, settings)
├── lib/            # Yardımcı fonksiyonlar (firebase, openai, utils)
├── data/           # Statik veriler ve sabitler
└── scripts/        # Bakım ve otomasyon scriptleri
```

---

## 🧪 Test

Birim testlerini çalıştırmak için:
```bash
npm run test
```

---

## 📝 Lisans

Bu proje **Arslan Ailesi** için özel olarak geliştirilmiştir. Tüm hakları saklıdır.

---

<p align="center">
  Geliştirilmiş <b>Premium</b> Deneyim - Arslan Panel
</p>

