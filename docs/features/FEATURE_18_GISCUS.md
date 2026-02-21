# Feature #18 — Giscus / GitHub Discussions Comments

> **Prioritas:** 🟡 Sedang (impact tinggi, effort rendah)  
> **Estimasi:** FE 3 jam · BE 0  
> **Dependencies:** Tidak ada  
> **Dependants:** Tidak ada

---

## 📋 Deskripsi

Sistem komentar di blog menggunakan GitHub Discussions via Giscus widget. Zero backend cost — login via GitHub, data tersimpan di GitHub Discussions. Theme sync otomatis dengan dark/light mode app.

### Prasyarat (satu kali setup)

1. Repository GitHub harus public (atau Giscus App di-install untuk private repo)
2. Enable GitHub Discussions di repo settings
3. Buat Discussion category khusus (e.g., "Blog Comments")
4. Dapatkan config dari https://giscus.app:
   - `repo`: `infinitedim/portfolio-frontend`
   - `repoId`: (dari Giscus config page)
   - `category`: "Blog Comments"
   - `categoryId`: (dari Giscus config page)

---

## ✅ Subtask Checklist

### Frontend (`portfolio-frontend`)

- [ ] **F-18.1** Install dependency

  ```bash
  bun add @giscus/react
  ```

- [ ] **F-18.2** Tambah env vars

  ```env
  NEXT_PUBLIC_GISCUS_REPO=infinitedim/portfolio-frontend
  NEXT_PUBLIC_GISCUS_REPO_ID=<from giscus.app>
  NEXT_PUBLIC_GISCUS_CATEGORY=Blog Comments
  NEXT_PUBLIC_GISCUS_CATEGORY_ID=<from giscus.app>
  ```

- [ ] **F-18.3** Buat komponen `GiscusComments` di `src/components/molecules/blog/giscus-comments.tsx`

  ```typescript
  "use client";
  import Giscus from "@giscus/react";
  import { useTheme } from "next-themes";

  export function GiscusComments({ slug }: { slug: string }) {
    const { resolvedTheme } = useTheme();

    return (
      <Giscus
        repo={process.env.NEXT_PUBLIC_GISCUS_REPO!}
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
        category={process.env.NEXT_PUBLIC_GISCUS_CATEGORY!}
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
        mapping="specific"
        term={slug}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={resolvedTheme === "dark" ? "dark_tritanopia" : "light"}
        lang="en"
        loading="lazy"
      />
    );
  }
  ```

- [ ] **F-18.4** Lazy load: wrap dengan `next/dynamic` untuk prevent SSR

  ```typescript
  // Di file yang mengimport:
  const GiscusComments = dynamic(
    () => import("@/components/molecules/blog/giscus-comments")
      .then(mod => ({ default: mod.GiscusComments })),
    { ssr: false, loading: () => <CommentsSkeleton /> }
  );
  ```

- [ ] **F-18.5** Integrasi di `src/app/blog/[slug]/page.tsx`
  - Render `<GiscusComments slug={slug} />` di bawah konten artikel
  - Wrapper: `<section>` dengan heading "Comments" dan separator
  - Position: setelah share buttons, sebelum footer
  - Margin top: `mt-12` atau `mt-16` untuk visual separation

- [ ] **F-18.6** Theme sync saat runtime
  - Saat user toggle dark/light: Giscus widget auto-update theme
  - `@giscus/react` component re-render saat `theme` prop berubah
  - `useTheme()` dari `next-themes` menyediakan `resolvedTheme` yang reactive

- [ ] **F-18.7** Comments skeleton loader
  - Buat `CommentsSkeleton`: 2-3 skeleton cards (muted bg, pulse animation)
  - Tampilkan saat Giscus iframe belum loaded

- [ ] **F-18.8** Conditional render: hanya tampilkan di published posts
  - Jangan render Giscus di draft/preview mode

---

## 📁 File Mapping

| File                                                                   | Aksi          | Deskripsi              |
| ---------------------------------------------------------------------- | ------------- | ---------------------- |
| `portfolio-frontend/src/components/molecules/blog/giscus-comments.tsx` | **Buat baru** | Giscus wrapper         |
| `portfolio-frontend/src/app/blog/[slug]/page.tsx`                      | Modifikasi    | Render GiscusComments  |
| `portfolio-frontend/.env.local`                                        | Modifikasi    | Tambah GISCUS env vars |
| `portfolio-frontend/package.json`                                      | Modifikasi    | Tambah `@giscus/react` |

---

## 🔌 API Contract

Tidak ada perubahan backend. Giscus berkomunikasi langsung dengan GitHub API via iframe.

---

## ✅ Acceptance Criteria

| #    | Kriteria                                                     | Cara Verifikasi    |
| ---- | ------------------------------------------------------------ | ------------------ |
| AC-1 | Komentar widget tampil di bawah setiap published blog post   | Visual check       |
| AC-2 | Login via GitHub berfungsi — bisa tulis komentar             | Manual test        |
| AC-3 | Komentar tersimpan di GitHub Discussions                     | Check GitHub repo  |
| AC-4 | Tema komentar ikut berganti saat user switch dark/light mode | Toggle theme test  |
| AC-5 | Widget lazy loaded — tidak memperlambat initial page load    | Network tab check  |
| AC-6 | Skeleton ditampilkan saat Giscus iframe loading              | Slow network test  |
| AC-7 | Reactions (👍 ❤️ dll) berfungsi                              | Manual test        |
| AC-8 | Draft/unpublished posts tidak menampilkan comments           | Preview mode check |

---

## 🔧 Technical Notes

### Giscus Mapping Options

- `mapping="specific"` + `term={slug}` — map 1 Discussion per blog post slug
- Alternatif: `mapping="pathname"` — map berdasarkan URL path
- Dipilih `specific` + `term={slug}` agar URL changes (contoh: domain migration) tidak break mapping

### Theme Options Available

- `light`, `dark`, `dark_dimmed`, `dark_high_contrast`, `dark_tritanopia`, `transparent_dark`
- Dipilih: `dark_tritanopia` untuk dark (lebih readable) dan `light` untuk light mode
- Bisa custom: buat CSS file dan pass URL sebagai theme

### Performance Impact

- Giscus loads via iframe → isolated dari main thread
- `loading="lazy"` → hanya load saat scroll ke area comments
- Bundle impact: `@giscus/react` hanya ~2KB gzipped (thin wrapper)

### Setup Giscus (One-Time)

1. Buka https://giscus.app
2. Masukkan repository name
3. Pilih "Discussion category" → "Blog Comments" (create dulu di repo)
4. Copy `repoId` dan `categoryId` ke env vars
5. Pastikan Giscus GitHub App terinstall di repo
