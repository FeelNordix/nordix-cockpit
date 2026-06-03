# Nordix Cockpit

Webapp voor Feel Nordix om klanten, reizen, reizigers, betalingen, reisdocumenten en notities overzichtelijk te beheren.

De app gebruikt Supabase als primaire databron. Mockdata en localStorage zijn alleen nog tijdelijke fallback.

## Environment variables

Maak lokaal een `.env.local` bestand aan met:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Gebruik dezelfde variabelen in Vercel.

## Starten

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.
