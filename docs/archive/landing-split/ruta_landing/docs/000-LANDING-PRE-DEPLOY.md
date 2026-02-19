# 000 - LANDING PRE-DEPLOY

Fecha de creación: 2026-02-16

Este documento es exclusivo de LANDING y debe mantenerse durante la migración al repo separado.
Ubicación elegida: `ruta_landing/docs/` (fuera de `apps/landing/public`, no se expone como asset web).

## 0) Estado actual (email)

- `LANDING_CONTACT_EMAIL_PROVIDER=brevo`
- `LANDING_CONTACT_FROM_EMAIL=noreply@lynxmedia.cl`
- `LANDING_CONTACT_NOTIFY_EMAIL=info@lynxmedia.cl`
- `LANDING_CONTACT_SEND_AUTOREPLY=1`
- `noreply@lynxmedia.cl` verificado en Google
- SPF de `lynxmedia.cl` incluye Brevo y Google
- Dominio autenticado en Brevo (DKIM configurado en Cloudflare)

## 1) Checklist obligatorio antes de deploy LANDING

### 1.1 Variables de entorno (runtime real)

- [ ] `LANDING_DATABASE_URL` correcto para entorno deploy
- [ ] `LANDING_PUBLIC_URL` con dominio real (https)
- [ ] `LANDING_CONTACT_EMAIL_PROVIDER=brevo`
- [ ] `LANDING_BREVO_API_KEY` vigente
- [ ] `LANDING_CONTACT_FROM_EMAIL=noreply@lynxmedia.cl`
- [ ] `LANDING_CONTACT_NOTIFY_EMAIL=info@lynxmedia.cl`
- [ ] `LANDING_CONTACT_SEND_AUTOREPLY=1`

### 1.2 DNS / autenticación email

- [ ] SPF final: `v=spf1 include:_spf.google.com include:spf.brevo.com -all`
- [ ] DKIM Brevo validado en panel Brevo (dominio autenticado)
- [ ] DMARC presente al menos en modo monitoreo (`p=none`)

### 1.3 Verificaciones automáticas

- [ ] `npm run landing:preflight` sin warnings críticos
- [ ] `npm run build:landing` OK

### 1.4 Smoke test funcional

- [ ] Envío formulario desde desktop
- [ ] Envío formulario desde mobile
- [ ] Llega notificación interna a `info@lynxmedia.cl`
- [ ] Llega autoreply al usuario
- [ ] Ninguno cae a spam (o queda aceptable y monitoreado)

### 1.5 Smoke test UX crítico

- [ ] Hero video correcto (loop + controles audio)
- [ ] Formulario abre/cierra bien en mobile y desktop
- [ ] Botón “Atrás” en mobile: cierra overlay -> cierra form -> recién sale
- [ ] Selector de servicio mobile popup OK
- [ ] Calendario custom OK (hoy/futuro, selección y cierre)

## 2) DMARC: ¿se puede postergar?

Sí, se puede postergar mientras DKIM/SPF estén correctos y tengas monitoreo.

### 2.1 Efecto de postergarlo

- Menor protección anti-spoofing del dominio
- Menor control sobre cómo otros proveedores tratan correos no autenticados
- Más dependencia de reputación histórica para inbox placement

### 2.2 Efecto de olvidarlo

- Riesgo sostenido de suplantación de dominio (`@lynxmedia.cl`)
- Riesgo de degradación progresiva de entregabilidad
- Sin política de enforcement para receptores (solo observación)

### 2.3 Recomendación de transición DMARC

1. Mantener temporalmente `p=none` con monitoreo de reportes.
2. Subir a `p=quarantine` cuando SPF/DKIM estén estables.
3. Evaluar `p=reject` en etapa madura.

### 2.4 Pruebas mínimas antes de subir DMARC (none -> quarantine/reject)

- [ ] `npm run landing:preflight` debe terminar en `OK`.
- [ ] Confirmar SPF activo con Brevo + Google (`include:spf.brevo.com` y `include:_spf.google.com`).
- [ ] Confirmar DKIM Brevo resolviendo (`brevo1._domainkey` y `brevo2._domainkey`).
- [ ] Ejecutar al menos 6 envíos de prueba del formulario (desktop y mobile, cuentas destino distintas: Gmail/Outlook/corporativo).
- [ ] Validar en cada correo recibido: `SPF=PASS`, `DKIM=PASS`, `DMARC=PASS` (Gmail -> Mostrar original).
- [ ] Verificar que notificación interna (`info@lynxmedia.cl`) y autoreply no caigan en spam.
- [ ] Confirmar que no existan otros sistemas enviando como `@lynxmedia.cl` sin autenticación.
- [ ] Monitorear 48-72h en `p=none` antes de endurecer.

#### Criterio para avanzar

- [ ] 100% de los envíos de formulario pasan SPF/DKIM/DMARC y sin regresiones de entrega.

#### Secuencia recomendada de endurecimiento

1. `p=quarantine; pct=25` por 24-48h.
2. `p=quarantine; pct=100` por 48-72h.
3. `p=reject` solo cuando no haya falsos positivos ni fuentes no alineadas.

## 3) Registro de cambios (este documento)

- 2026-02-16: Creación inicial del checklist pre-deploy LANDING.
- 2026-02-16: Se agrega plan de pruebas previo a endurecer política DMARC.
