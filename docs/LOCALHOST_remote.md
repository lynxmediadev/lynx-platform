# Histórico / deprecado

Este archivo contenía instrucciones de NextAuth y direcciones IP de ejemplo que
ya no corresponden a LYNX Platform. La aplicación usa Supabase Auth y no debe
configurarse con `NEXTAUTH_URL`, `AUTH_TRUST_HOST` ni `NEXT_PUBLIC_SITE_URL`.

Usa el [runbook local](operations/runbook-local.md). Para desarrollo en WSL:

```bash
npm run dev -- --hostname 0.0.0.0
```

Abre `http://localhost:3000` en el host. El acceso por Wi-Fi depende del bridge
de red configurado en Windows/WSL y no debe documentarse con una IP fija.
