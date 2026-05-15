# Bitelex Website — Kompletan tehnički i UX audit

---

## 1. Astro struktura projekta

### Što je dobro
- Čist pattern jedna komponenta – jedan folder, s CSS modulima u istom folderu.
- `prerender = true` + `getStaticPaths()` ispravno korišteni na svim stranicama s contentom.
- `output: "server"` mod postoji samo radi `/api/contact` route-a — sve ostale stranice su pre-renderirane kao statički HTML. Ovo je ispravan pristup.
- Helper funkcije `buildStaticPaths` / `resolveLang` / `resolveT` u [page-utils.ts](src/lib/page-utils.ts) su dobro dizajnirane i DRY.
- Nema Reacta uopće — čisti Astro. Odlično za performanse.

### Problemi

**`igrica/` direktorij u root-u projekta** — **Ozbiljnost: Srednja**

Potpuno zaseban mini-game projekt (s vlastitim `netlify.toml` i serverless funkcijom) živi unutar root-a Astro repozitorija. Ovo će biti uključeno u deploy zajedno sa sajtom.
- Zašto je problem: Zagađuje repo, rizikuje slučajni deploy nesrodne aplikacije, i zbunjuje Netlify build kontekst jer postoji drugi `netlify.toml` unutar `igrica/` foldera.
- Rješenje: Premjesti `igrica/` u vlastiti zaseban repozitorij.

**`output: "server"` treba biti `output: "hybrid"`** — **Ozbiljnost: Niska**

Koristi se `output: "server"` ali gotovo svaka stranica ima `export const prerender = true`. Ispravni semantički mod je `output: "hybrid"` (default je statički, server rendering se uključuje po potrebi).
```js
// astro.config.mjs
export default defineConfig({
  output: "hybrid", // ← ispravno za ovaj slučaj
  ...
});
```

**`src/pages/web-lab.astro` i `src/pages/open-source-integrator.astro` hardkodiraju `/hr/`** — **Ozbiljnost: Niska**

Ove fallback stranice uvijek redirectaju na hrvatsku verziju, bez obzira na jezik browsera posjetitelja.
```astro
// Bolji fallback
return Astro.redirect(
  Astro.request.headers.get("accept-language")?.startsWith("hr")
    ? "/hr/web-lab"
    : "/en/web-lab"
);
```

**Contact page stilovi se nalaze u `global.css`** — **Ozbiljnost: Niska**

Svih ~180 linija `.contact-*` klasa je u [global.css](src/styles/global.css) ali pripada samo jednoj stranici. Trebaju biti CSS modul smješten uz contact stranicu ili `KontaktForm` komponentu.

---

## 2. React komponente

U ovom projektu **nema React komponenti**. `package.json` nema `@astrojs/react` dependency. To je zapravo ispravna odluka — sve je čisti Astro, što rezultira manjom količinom JavaScripta koji se šalje browseru.

Ako budeš dodavao React u budućnosti, koristi `client:visible` za interaktivne komponente ispod folda i `client:idle` za nekritične.

---

## 3. Astro hidratacija

**Nula `client:*` direktiva — odlično.** Nema nepotrebne hidratacije. Sva interaktivna ponašanja su vanilla JS unutar `<script>` blokova, koje Astro bundluje i deduplikuje pri buildu.

Jedina iznimka vrijedna napomene:

**Swiper se učitava s `is:inline type="module"`** — **Ozbiljnost: Visoka**

[PortfolioSection.astro:132-159](src/components/PortfolioSection/PortfolioSection.astro#L132-L159) učitava Swiper s CDN-a u runtime-u, uključujući zaseban CSS fajl ubačen unutar documenta. `is:inline` sprečava Astro da ga bundluje ili deduplikuje.

```astro
<!-- Trenutno — CDN, nije bundlano, bez garancije cachiranja, ubačeni <link> u body -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" />
<script is:inline type="module">
  import Swiper from "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.mjs";
```

Rješenje:
```bash
npm install swiper
```
```astro
---
import 'swiper/css';
---
<script>
  import Swiper from 'swiper/bundle';
  // ...
</script>
```

---

## 4. Performanse

### Učitavanje fontova — **Ozbiljnost: Visoka**

Postoji kritičan mismatch fontova:
- [Layout.astro:33-35](src/layouts/Layout.astro#L33-L35) učitava **"Sansation"** s Google Fonts
- [global.css:20](src/styles/global.css#L20) koristi `font-family: "Syne", sans-serif` na body-ju
- **"Sansation" se učitava ali nikad ne koristi. "Syne" se koristi ali nikad ne učitava.**

Dodatno, `JetBrains Mono` se referencira u CSS-u desetine puta (badge-ovi, labele, inputi, kod) ali **nigdje se ne učitava**. Tiho se vraća na sistemski monospace font.

Rješenje u [Layout.astro](src/layouts/Layout.astro):
```html
<link
  href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
```
I ukloni Sansation link.

### Nekorišteni asseti — **Ozbiljnost: Visoka**

| Fajl | Veličina | Koristi se? |
|------|----------|-------------|
| [line.png](src/assets/line.png) | **2 MB** | Nigdje se ne referencira |
| [zarulja.png](src/assets/zarulja.png) | 917 KB | Nigdje se ne referencira |
| [hero2.png](src/assets/hero2.png) | 408 KB | Nigdje se ne referencira |
| [line2.png](src/assets/line2.png) | 163 KB | Nigdje se ne referencira |
| [background.svg](src/assets/background.svg) | 1 KB | Nigdje se ne referencira |
| [astro.svg](src/assets/astro.svg) | 3 KB | Default starter fajl, nekorišten |

Ovi fajlovi dodaju ~3,5 MB u repozitorij i zbunjuju buduće suradnike. Obriši ih.

### Portfolio slike — **Ozbiljnost: Visoka**

[PortfolioSection.astro:83-88](src/components/PortfolioSection/PortfolioSection.astro#L83-L88):
- Slike se dohvaćaju s Unsplasha s `w=3131` — **full-resolution** slika servirana pri visini od 192px. To je ~40× više pixela nego što je potrebno.
- Nema `loading="lazy"` na `<img>` tagovima.
- Nema eksplicitnih `width`/`height` atributa — uzrokuje layout shift (CLS penalizacija).
- Jedna slika je s `encrypted-tbn0.gstatic.com` (Google cache thumbnails) — ovaj URL može isteći ili biti blokiran.

Rješenje: Zamijeni stvarnim screenshotovima klijentskih projekata. Ako privremeno koristiš Unsplash, dodaj `&w=800&q=60` u URL i dodaj `loading="lazy"` + dimenzije.

```html
<img
  src={w.image}
  alt={w.title}
  width="800"
  height="450"
  loading="lazy"
  decoding="async"
  class="..."
/>
```

### TechSlider CDN ikone — **Ozbiljnost: Srednja**

[TechSlider.astro:5-53](src/components/TechSlider/TechSlider.astro#L5-L53) učitava 11 zasebnih SVG ikona s `cdn.jsdelivr.net/gh/devicons/devicon/`. Svaka je zaseban HTTP request pri učitavanju stranice, bez preloadinga.
- Rješenje: Preuzmi SVG-ove i stavi ih u `src/assets/`, ili koristi npm paket poput `devicon`, ili inline SVG-ove kao Astro komponente.

### Neprekidne CSS animacije — **Ozbiljnost: Srednja**

Div `page-bg` s `position: fixed` pokreće dvije CSS animacije ([global.css:281-296](src/styles/global.css#L281-L296)) na svakoj stranici, svaki frame. Hero SVG pokreće 10+ istovremenih CSS animacija. Ovo može triggerati GPU layer promotion kroz cijeli viewport za vrijeme skrolanja.
- Rješenje: Poštuj `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .orb-1, .orb-2 { animation: none; }
  /* pauziraj hero svg animacije */
}
```

### Swiper CSS ubačen unutar `<section>` — **Ozbiljnost: Srednja**

[PortfolioSection.astro:39](src/components/PortfolioSection/PortfolioSection.astro#L39):
```astro
<link rel="stylesheet" href={swiperCssHref} />  <!-- unutar section body-ja! -->
```
`<link>` tag ubačen unutar body-ja documenta nakon što je `<head>` zatvoren uzrokuje da browser re-parsira stilove usred rendera, što proizvodi flash neoblikovanog sadržaja (FOUC). Premjesti učitavanje stilova u `<head>` ili koristi npm paket pristup.

### Viewport meta tag — **Ozbiljnost: Niska**

[Layout.astro:27](src/layouts/Layout.astro#L27):
```html
<meta name="viewport" content="width=device-width" />
```
Nedostaje `initial-scale=1`. Treba biti:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

---

## 5. Raspored vidljivog sadržaja i korisničko iskustvo

### Redoslijed sekcija na homepageu
```
1. Navbar
2. Hero (van <main>)
3. Divider
4. [<main> počinje ovdje]
5. Usluge (3 kartice)
6. Proizvodi
7. Divider
8. Naša misija (3 kartice)
9. Divider
10. Portfolio (swiper)
11. Footer
```

### Above-the-fold / Hero sekcija

**Što korisnik vidi prvo:** Veliki animirani geometrijski SVG s desne strane vizualno dominira. Tekst s lijeve strane s "Technical solutions / for serious / growth." je naslov.

**Problemi:**
- **Ozbiljnost: Visoka** — Badge piše *"We share ideas"*. Ovo je neodređeno i nejasno. Ne govori posjetitelju tko ste ni što radite. Usporedi s: *"Web & Engineering Studio"* ili *"For growing businesses"* (što je default/fallback u komponenti).
- **Ozbiljnost: Visoka** — Sekundarni CTA `ctaView = "View Our Work"` vodi na `#product` (sekcija Proizvodi). Sekcija Proizvodi prikazuje samo "Dinio DNS" — proizvod u razvoju. Ovo zbunjuje posjetitelja. "View Our Work" treba voditi na `#portfolio`.
- **Ozbiljnost: Srednja** — *"100% Happy Clients"* — ova tvrdnja nije provjerljiva i može smanjiti kredibilitet. Razmotri zamjenu specifičnim brojem: "30+ zadovoljnih klijenata" ili uklanjanje u korist "6 godina iskustva."
- **Ozbiljnost: Srednja** — Opis heroja *"We design and develop reliable, scalable engineering solutions with a focus on innovation, efficiency, and long-term sustainability"* je generička agencijska kopija. Ne navodi tko je ciljni kupac, koji konkretan problem rješavate, niti po čemu se razlikujete. Posjetitelj koji dolazi prvi put još uvijek ne zna gradite li web stranice, aplikacije ili IoT uređaje.
- **Ozbiljnost: Niska** — Kicker `// engineering` zvuči više kao komentar u kodu nego kao pozicioniranje. Može rezonirati s tehničkim kupcima ali odbija netehničke poslovne vlasnike.

### Sekcija Usluge
**Pozicija:** Odmah nakon heroja — **dobro postavljeno.**
**Problem:** Tri kartice ("Web i aplikacije", "Elektrotehnička rješenja", "Integrator otvorenog koda") su vrlo različite vrste usluga. Posjetitelj koji dolazi s namjerom angažiranja web studija može biti zbunjen vidjeti "Elektrotehnička rješenja" kao drugu, istaknututu karticu. Istaknuta kartica (`highlightIndex={1}`) privlači pažnju na elektrotehničko — vjerojatno nije najčešći zahtjev.
- **Rješenje:** Ili promijeni redoslijed (web prvi, istaknut), ili napravi zasebne "Web" vs "Inženjering" landing stranice s jasnim putanjama.

### Sekcija Proizvodi
**Pozicija:** Nakon usluga — **upitno.**
- "Dinio DNS" je opisan kao *"u razvoju"*. Prikazivanje nedovršenog proizvoda kao druge sekcije na glavnoj stranici može smanjiti povjerenje i konverziju za uslužne klijente.
- **Prijedlog:** Premjesti Proizvode niže na stranicu, ili zamijeni ovaj slot CTA/booking sekcijom.

### Sekcija Naša misija
**Pozicija:** Nakon Proizvoda — **loše postavljeno.**
- Misija/vrijednosti trebaju biti blizu vrha (nakon heroja) kako bi gradile povjerenje, prije nego pokažeš proizvode/usluge. Kao treća sekcija, većina korisnika je već odlučila ostati ili otići prije nego vidi tvoje vrijednosti.
- Opisi su i previše šturi: *"We prioritize digital privacy and security."* — nema specifičnosti, nema dokaza.
- **Rješenje:** Premjesti "Naša misija" da se pojavljuje između Heroja i Usluga, ili je spoji u "O nama" isječak iznad folda.

### Sekcija Portfolio
**Pozicija:** Posljednja sekcija prije footera — **prihvatljivo ali moglo bi biti više.**
- Portfolio je najsnažniji signal povjerenja na web stranici agencije. Trebao bi doći odmah nakon Usluga, ili barem prije Misije.
- Portfolio slike su sve generičke Unsplash stock fotografije (osoba koja kuca kod, tim na sastanku, tiskana ploča) — **nijedna nije stvarni screenshot klijentskog projekta.**
- **Rješenje:** Koristi stvarne screenshotove od Bitelex, Enduro Spirit, Aureus kao portfolio slike.

### Nedostaje: Testimonijali / Social proof
Nema testimonijala, klijentskih logoa niti case studija. Za B2B agenciju, ovo je najčešći jaz u konverziji. Jedan pravi klijentski citat konvertira značajno bolje od bilo kojeg napisanog headlinea.

### Nedostaje: Cijene ili proces rada
Posjetitelji s komercijalnom namjerom žele razumjeti trošak ili proces angažmana prije kontaktiranja. Čak i sekcija "Kako radimo" s 3 koraka (Discover → Build → Launch) smanjuje bounce na contact stranici.

### Mobile layout
Hero se pravilno prebacuje na jedan stupac na 900px. CTA i stats se pravilno centriraju. Animirani SVG geo dijagram u heroju — nema `display: none` breakpointa — renderira se ispod teksta i zauzima značajan prostor.
- Provjeri treba li hero SVG biti skriven na mobilnom (decorative je s `aria-hidden`) — dodaje visinu bez komunikacije vrijednosti.

---

## 6. SEO

### Nedostaje: Meta opis — **Ozbiljnost: Visoka**

[Layout.astro:38](src/layouts/Layout.astro#L38):
```astro
{description ? <meta name="description" content={description} /> : null}
```
Homepage ([lang]/index.astro) **ne prosljeđuje `description` prop** u `<Layout>`. Homepage nema meta description tag. Google će automatski generirati jedan, što je obično suboptimalno.

Rješenje u [src/pages/[lang]/index.astro](src/pages/[lang]/index.astro):
```astro
<Layout
  brand={t.navbar.brand}
  labels={t.navbar}
  title="Bitelex | Web Development & Engineering Studio"
  description="Bitelex gradi brze, skalabilne web aplikacije i inženjerska rješenja za rastuće tvrtke. Zatražite ponudu danas."
>
```

### Nedostaju: Open Graph i Twitter Cards — **Ozbiljnost: Visoka**

Ni jedan `og:*` ili `twitter:*` tag ne postoji nigdje u codebase-u. Kada se linkovi dijele na LinkedInu, Slacku ili Twitteru, prikazat će se bez preview slike, bez naslova i bez opisa.

Dodaj u [Layout.astro](src/layouts/Layout.astro) unutar `<head>`:
```html
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={Astro.url.href} />
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
```

### Nedostaje: Canonical URL — **Ozbiljnost: Visoka**

Nema `<link rel="canonical">` taga. S dvije jezičke verzije na `/hr/` i `/en/`, Google ih može tretirati kao duplirani sadržaj.

```html
<link rel="canonical" href={Astro.url.href} />
```

### Nedostaju: Hreflang tagovi — **Ozbiljnost: Visoka**

Sajt ima dvije jezičke verzije ali nema `hreflang` anotacija. Google neće znati koju verziju prikazati kojoj publici.

```html
<link rel="alternate" hreflang="hr" href={`https://bitelex.com/hr${pagePath}`} />
<link rel="alternate" hreflang="en" href={`https://bitelex.com/en${pagePath}`} />
<link rel="alternate" hreflang="x-default" href="https://bitelex.com/hr/" />
```

### Pogrešan URL u robots.txt — **Ozbiljnost: Visoka**

[public/robots.txt:3](public/robots.txt#L3):
```
Sitemap: https://bitelex2.netlify.app/sitemap-index.xml
```
Sitemap pokazuje na `bitelex2.netlify.app` (stari staging URL), ne na `bitelex.com`. Google će pokušati indeksirati pogrešni sitemap.

Rješenje:
```
Sitemap: https://bitelex.com/sitemap-index.xml
```

### Naslov stranice nije opisivan — **Ozbiljnost: Srednja**

Svaka stranica koristi `<title>Bitelex</title>` (samo ime branda). Title tag je najvažniji SEO element. Treba opisivati sadržaj stranice:
- Homepage: `Bitelex | Web Development & Engineering Studio`
- Web Lab: `Web Lab | Bitelex`
- Kontakt: `Kontakt | Bitelex`

### Nedostaje: Schema markup — **Ozbiljnost: Srednja**

Nema strukturiranih podataka uopće. Minimalno dodaj `Organization` schema na homepage:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bitelex",
  "url": "https://bitelex.com",
  "sameAs": [
    "https://www.linkedin.com/company/bitelex",
    "https://www.github.com/bitelex"
  ]
}
</script>
```

---

## 7. Pristupačnost (Accessibility)

### Hero je van `<main>` — **Ozbiljnost: Visoka**

U [[lang]/index.astro:52](src/pages/[lang]/index.astro#L52), `<Hero>` komponenta i `<Divider>` se renderiraju **prije** `<main>` elementa. `<main>` počinje tek nakon Heroja. To znači da je primarni sadržaj stranice (naslov, CTA) van `<main>`, što kvari skip-navigation i landmark navigaciju za korisnike screen readera.

Rješenje:
```astro
<!-- [lang]/index.astro -->
<Layout ...>
  <div class="page-bg" ...>...</div>
  <main>
    <Hero ... />
    <Divider />
    <!-- ostatak sekcija -->
  </main>
</Layout>
```

### Contact forma nije lokalizirana — **Ozbiljnost: Visoka**

[KontaktForm.astro](src/components/Kontakt/KontaktForm.astro) ima sve labele, placeholder tekstove i tekst gumba hardkodirane na engleskom (`"Name"`, `"Email"`, `"Subject"`, `"Message"`, `"Submit"`). i18n JSON ima potpune prijevode za contact formu u oba `en.json` i `hr.json` pod `contact.fields` i `contact.placeholders` — ali komponenta ih nikad ne prima niti koristi.

Hrvatski posjetitelji na `/hr/contact` vide englesku formu. Ovo utječe i na screen readere koji koriste tekst labele za najavljivanje polja.

### `aria-haspopup` ima pogrešnu vrijednost — **Ozbiljnost: Srednja**

[Navbar.astro:129](src/components/Navbar/Navbar.astro#L129):
```astro
aria-haspopup={item.children ? "true" : undefined}
```
`"true"` je deprecated. Za dropdown meni, ispravna vrijednost je `"menu"`:
```astro
aria-haspopup={item.children ? "menu" : undefined}
```

### Vanjski linkovi bez `rel="noreferrer"` — **Ozbiljnost: Niska**

[PortfolioSection.astro:80](src/components/PortfolioSection/PortfolioSection.astro#L80):
```html
<a href={w.url} target="_blank" rel="noopener" ...>
```
`noopener` sam po sebi je dovoljan za sigurnost jer moderni browseri već blokiraju `window.opener`. Ali `noopener noreferrer` je najsigurniji default:
```html
rel="noopener noreferrer"
```

### Footer `#about` anchor je mrtav link — **Ozbiljnost: Srednja**

[Footer.astro:100](src/components/Footer/Footer.astro#L100):
```html
<a href={lang ? `/${lang}/#about` : "#about"}>About</a>
```
Na homepageu ne postoji element s `id="about"`. Ovaj link vodi korisnika na vrh home stranice i izgleda kao greška.

Rješenje: Ili dodaj `id="about"` na mission ili about sekciju, ili promijeni footer link na `/${lang}/about`.

### Nedostaje podrška za `prefers-reduced-motion` — **Ozbiljnost: Srednja**

Hero ima 10+ CSS animacija i pozadina pokreće 2 neprekidne animacije. Nigdje ne postoji `@media (prefers-reduced-motion: reduce)` blok.

---

## 8. Kvaliteta koda

### Duplikiran `@keyframes boltFlash` — **Ozbiljnost: Srednja**

[global.css:373](src/styles/global.css#L373) i [global.css:396](src/styles/global.css#L396) definiraju identično `@keyframes boltFlash` pravilo dva puta. Jedno treba ukloniti.

### CSS referencira neučitani font `"Syne"` — **Ozbiljnost: Visoka**

(Obrađeno pod Performanse.) Ovo je i problem kvalitete koda — font family se referencira u CSS-u koji se nikad ne učitava, što znači da svaki tekst koji koristi taj font tiho degradira na sistemski sans-serif.

### Contact forma ne koristi i18n — **Ozbiljnost: Visoka**

`KontaktForm.astro` hardkodira sve stringove. i18n sistem postoji i dobro radi na ostalim mjestima. Komponenta treba primati labele kao props:
```astro
---
interface Props {
  labels?: {
    name: string;
    email: string;
    subject: string;
    message: string;
    submit: string;
  }
}
const { labels = { name: "Name", email: "Email", ... } } = Astro.props;
---
```

### `ServerMap` prima prop koji se ne koristi — **Ozbiljnost: Srednja**

[ServerMap.astro:18](src/components/ServerMap/ServerMap.astro#L18):
```astro
const { ariaLabel }: Props = Astro.props;  // locations se prima ali nikad ne koristi
```
Prop `locations` je definiran u tipu i prosljeđuje se u parent komponenti, ali se destrukturira bez upotrebe. Komponenta samo renderira statičku sliku bez obzira na lokacije. Ili ukloni `locations` prop iz interfacea (ako je namjerno), ili zapravo renderiraj markere lokacija na mapi.

### `FeatureRows` ima hardkodirani index ikona — **Ozbiljnost: Niska**

[FeatureRows.astro:119-121](src/components/FeatureSection/FeatureRows.astro#L119-L121):
```astro
{i === 0 && <IconBrowser />}
{i === 1 && <IconNetwork />}
{i === 2 && <IconChip />}
```
Ovo se tiho lomi ako array ima manje od 3 itema ili drugačiji redoslijed. Itemi trebaju nositi vlastite reference na ikone putem `featureIcons` patterna koji se već koristi na ostalim mjestima.

### Tri zakomentirana `<script>` taga — **Ozbiljnost: Niska**

Svaka upotreba `FeatureSection` u izvornom kodu ima:
```html
<!-- <script src="../../lib/feature-gsap.ts"></script> -->
```
Ovo je mrtav kod od uklonjenog GSAP animacijskog pokušaja. Treba ga počistiti.

### `.contact-*` stilovi trebaju biti u CSS modulu — **Ozbiljnost: Niska**

~230 linija `.contact-*` stilova živi u [global.css](src/styles/global.css). Ovo su stilovi specifični za jednu stranicu koji zagađuju globalni scope. Premjesti ih u [KontaktForm.module.css](src/components/Kontakt/KontaktForm.module.css).

---

## 9. Deploy i produkcijska spremnost

### Email se šalje s testne domene — **Ozbiljnost: Visoka**

[src/pages/api/contact.ts:60](src/pages/api/contact.ts#L60):
```ts
from: "Bitelex <onboarding@resend.dev>",
```
`onboarding@resend.dev` je Resend-ov **test/sandbox sender** za neovjerene račune. Emailovi s ove adrese često završe u spamu i imaju rate limit. Za produkciju, moraš verificirati vlastitu domenu u Resend dashboardu i koristiti `noreply@bitelex.com` ili slično.

### Hardkodirana email adresa primatelja — **Ozbiljnost: Srednja**

[src/pages/api/contact.ts:62](src/pages/api/contact.ts#L62):
```ts
to: ["pipiklepic1@gmail.com"],
```
Osobna email adresa je hardkodirana u izvornom kodu. Ovo je u git historiji i bit će vidljivo svakome ko klonira repozitorij. Premjesti u environment varijablu:
```ts
to: [import.meta.env.CONTACT_RECIPIENT_EMAIL ?? "hello@bitelex.com"],
```

### `robots.txt` pokazuje na pogrešni sitemap — **Ozbiljnost: Visoka**

Već obrađeno u SEO sekciji. Ispravi URL na `https://bitelex.com/sitemap-index.xml`.

### `webmanifest` nema dovoljno ikona za PWA — **Ozbiljnost: Niska**

[public/site.webmanifest](public/site.webmanifest) referencira samo 180×180 PNG. Za punu PWA usklađenost, potrebne su barem 192×192 i 512×512 ikone. Manifest se također ne linkuje iz `<head>`.
```html
<link rel="manifest" href="/site.webmanifest" />
```

### GSAP je naveden kao dependency ali se ne koristi — **Ozbiljnost: Niska**

[package.json](package.json) navodi `"gsap": "^3.12.5"` kao runtime dependency. Nijedan fajl ne importira niti koristi GSAP (jedina referenca je zakomentiran script tag). Nepotrebno se dodaje u produkcijsku deklaraciju.
```bash
npm uninstall gsap
```

---

## Predloženi bolji redoslijed sekcija na homepageu

Trenutni redoslijed ima problem s konverzijom: signali povjerenja dolaze nakon proizvoda.

**Preporučeni redoslijed:**
```
1. Navbar
2. Hero — naslov, primarni CTA ("Zatraži ponudu"), sekundarni ("Pogledaj radove")
3. Usluge — 3 kartice (web, elektro, open-source)
4. Portfolio — stvarni screenshotovi, imena klijenata, linkovi
5. O nama / Misija — kratka izjava o kredibilitetu + 3 kartice vrijednosti
6. Proizvodi — Dinio DNS (kao sekundarna/buduća napomena)
7. Contact CTA — "Spreman za start? Razgovarajmo."
8. Footer
```

---

## Prioritizirana lista zadataka

### 🔴 Hitni popravci (kvare SEO, povjerenje ili funkcionalnost)

1. Ispravi `robots.txt` sitemap URL — `bitelex2.netlify.app` → `bitelex.com`
2. Dodaj meta description na homepage
3. Ispravi font mismatch: učitaj Syne + JetBrains Mono, ukloni Sansation
4. Promijeni email sendera s `onboarding@resend.dev` na verificiranu domenu
5. Premjesti email primatelja u environment varijablu (`CONTACT_RECIPIENT_EMAIL`)
6. Dodaj Open Graph + Twitter card tagove u `Layout.astro`
7. Dodaj canonical tag u `Layout.astro`
8. Dodaj hreflang tagove za HR/EN
9. Ispravi strukturu Hero → `<main>` (Hero mora biti unutar `<main>`)
10. Ispravi footer `#about` anchor (ne vodi nikuda)

### 🟡 Važna poboljšanja performansi / SEO / UX

11. Instaliraj Swiper lokalno (`npm install swiper`) — ukloni CDN load + `<link>` u body-ju
12. Obriši nekorištene large assete: `line.png` (2 MB), `zarulja.png`, `hero2.png`, `line2.png`
13. Ispravi portfolio slike — koristi stvarne screenshotove, ispravna veličina (`w=800`), dodaj `loading="lazy"` + width/height
14. Dodaj `initial-scale=1` u viewport meta
15. Preuzmi DevIcon SVG-ove lokalno umjesto 11+ CDN requesta
16. Lokaliziraj contact formu (poveži i18n prijevode s `KontaktForm.astro`)
17. Ispravi sekundarni CTA "View Our Work" — treba voditi na `#portfolio`, ne `#product`
18. Dodaj `@media (prefers-reduced-motion: reduce)` za pozadinsku i hero animaciju
19. Dodaj Organization schema markup na homepage
20. Učini naslove stranica opisivima (`Bitelex | Web Development Studio`)
21. Promijeni `aria-haspopup` s `"true"` na `"menu"` na nav dropdownima
22. Dodaj stvarne portfolio slike (trenutno sve stock fotografije s Unsplasha)

### 🟢 Refaktoring i kvaliteta koda

23. Premjesti `.contact-*` stilove iz `global.css` u `KontaktForm.module.css`
24. Ukloni duplikiran `@keyframes boltFlash` u `global.css`
25. Ukloni tri zakomentirana GSAP script taga u `FeatureSection`
26. Premjesti `igrica/` u vlastiti zaseban repozitorij
27. Promijeni `output: "server"` u `output: "hybrid"` u `astro.config.mjs`
28. Ispravi `ServerMap.astro` — koristi ili ukloni `locations` prop
29. Ispravi `FeatureRows.astro` indexiranje ikona — koristi data-driven ikone
30. Pokreni `npm uninstall gsap` (naveden kao dependency, nikad se ne importira)
31. Dodaj `rel="noreferrer"` na vanjske portfolio linkove
32. Dodaj `<link rel="manifest" href="/site.webmanifest">` u Layout
33. Dodaj `<link rel="sitemap">` tag u `<head>`
