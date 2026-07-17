# 🚀 Mushfiq's BDIX Repo

A custom plugin repository for the [Nuvio](https://github.com/NuvioMedia) streaming app, specializing in high-speed BDIX server streaming for users in Bangladesh.

This repository hosts custom-built scrapers designed to bypass standard web scraping by targeting internal BDIX FTP servers, delivering buffer-free 1080p content directly over local subnets. You must be able to access BDIX connected servers (e.g. Dhakaflix: 172.16.50.4) if you want to successfully use this repository.

---

## 📦 Installation

To install this repository in your Nuvio app, follow these steps:

1. Open the **Nuvio App**.
2. Navigate to **Settings** > **General** > **Content & Discovery** > **Plugins** 
3. Under the **Add Repository** section, paste the following URL:
   `https://raw.githubusercontent.com/mushfiqamin/nuvio-providers/main/manifest.json`
4. Tap **Install Plugin Repository**.
5. The providers will now be active in your search results!

---

## ⚡ Available Scrapers

### DhakaFlix (BDIX)
Direct high-speed HTTP streaming from the DhakaFlix (SamOnline) FTP servers. 
* **Target Audience:** BDIX-connected internet users in Bangladesh.
* **Content:** Movies & TV Shows (MP4, MKV). Anime/Animated Tv Shows will be added soon
* **Key Features:**
  * **Advanced Parsing:** Uses TMDB API integration to match movie release years, preventing false positives.
  * **Smart TV Filtering:** Employs strict Regex episode filtering to perfectly match TV show files regardless of uploader naming conventions (e.g., seamlessly handles `S01E01`, `s01.e01`, etc.).
  * **Internal Subnets:** Connects directly to `172.16.x.x` ranges for ultra-fast, unmetered ISP speeds (100 Mbps +)

---

## 🛠️ Development

If you are cloning this repository to build or modify your own providers:

1. Install dependencies (if any) using `npm install`.
2. Write or modify your extractor logic inside `src/<provider_name>/`.
3. Compile the production build using the build script:
   `node build.js bdix`
4. Ensure the compiled output is directed to the `providers/` directory and referenced correctly in the `manifest.json`.

---

## ⚠️ Disclaimer

This repository does not host, store, or distribute any media files. It simply provides automated scraping scripts that format local directory indices into a layout compatible with the Nuvio application. Users are responsible for their own network configurations and the content accessed through their local ISP servers.