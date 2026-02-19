# Clean Base
Este repo incluye una rama `clean-base` que guarda la versión mínima del proyecto:
- Sin dummy data de T3.
- Con mocks listos para empezar a trabajar diseño o features.
- Con `.gitignore` limpio y carpeta `/notes` excluida.

Usar esta rama como referencia si se requiere volver a un estado inicial sólido.

## Archivo de split

La documentación histórica de la separación Landing/Platform quedó archivada en:

- `docs/archive/landing-split/`


## WSL (Windows Subsystem for Linux)

Recomendado: clona el repo dentro de WSL (por ejemplo en /home/tu-usuario) para mejor performance.

### Requisitos
- WSL2 con una distro Linux (Ubuntu recomendado).
- Docker Desktop o Podman Desktop para levantar la base de datos local.

### Setup basico
```bash
sudo apt update
sudo apt install -y curl ca-certificates build-essential
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

npm install
```

### Base de datos y dev server
```bash
# si no existe, crea tu .env.local desde el ejemplo
cp .env.example .env.local

./start-database.sh
npm run db:push
npm run dev
```


# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
