# Guia — Pipeline Docker CI/CD (aula 12)

Fluxo final:

```
feature/* --PR--> develop --(CI: lint + testes + merge)--> main --(CD: build imagem -> Docker Hub -> deploy EC2)
```

O que já está no repositório (branch `feature/docker-cd`):

| Arquivo | Função |
|---|---|
| `Dockerfile` | Gera a imagem da aplicação (Node 20 Alpine, só dependências de produção) |
| `.dockerignore` | Evita copiar `node_modules`, testes etc. para a imagem |
| `docker-compose.yaml` | Sobe o container na EC2 (porta 3000, `restart: always`) |
| `.github/workflows/cd-conteiner.yaml` | Novo CD: build + push no Docker Hub + deploy via SSH |
| `.github/workflows/cd.yml.disabled` | CD antigo (rsync) desabilitado, como pedido no material |
| `package.json` | Ganhou o script `"start": "node src/app.js"` (o container usa `npm start`) |

---

## Fase 1 — Docker Hub

1. Criar conta em https://hub.docker.com (anote seu **username**).
2. Criar repositório **`cesusc-devops`** (público).
3. Account Settings → Personal access tokens → **Generate new token**
   - Descrição: `GitHub_Actions_Pipeline`
   - Permissão: **Read & Write**
   - Copie o token (só aparece uma vez).

## Configuração no GitHub

Repositório → **Settings → Secrets and variables → Actions**

Aba **Secrets**:

| Nome | Valor |
|---|---|
| `DOCKERHUB_TOKEN` | token gerado no passo 3 |
| `SSH_PRIVATE_KEY` | conteúdo do arquivo `.pem` da EC2 (já deve existir da aula anterior) |
| `EC2_HOST` | IP público atual da instância EC2 |
| `ACESSS_TOKEN` | já existe (usado pelo CI para fazer merge na main) |

Aba **Variables**:

| Nome | Valor |
|---|---|
| `DOCKERHUB_USERNAME` | seu username do Docker Hub |

> O IP público da EC2 muda toda vez que a instância é parada/iniciada (sem Elastic IP).
> Por isso ele fica no secret `EC2_HOST`: quando mudar, atualize só o secret.

## Fase 2 — EC2

### Security Group (console AWS)
Regras de entrada: **22** (SSH) e **3000** (aplicação), origem `0.0.0.0/0`.

### Instalar Docker (conectado via SSH na instância)

```bash
sudo apt-get update
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker
exit
```

Conecte de novo (para valer o grupo `docker`) e teste:

```bash
docker run --rm hello-world
docker compose version
```

### Pasta do projeto

```bash
sudo mkdir -p /opt/cesusc-devops
sudo chown ubuntu:ubuntu /opt/cesusc-devops
```

### PM2 (aplicação antiga)
Se a aplicação ainda roda pelo PM2 da aula anterior, ela ocupa a porta 3000 e o container não sobe. Pare-a:

```bash
pm2 delete all
pm2 save
```

## Fase 3 — Disparar o pipeline

1. Abrir PR `feature/docker-cd` → `develop` e fazer merge.
2. O **CI** roda (lint + testes) e faz merge de `develop` em `main`.
3. O push na `main` dispara o **Docker Image CICD**:
   - `build`: login no Docker Hub, `docker build`, tags `:<sha>` e `:latest`, `docker push`
   - `deploy`: copia o `docker-compose.yaml` para `/opt/cesusc-devops`, faz `docker pull` e `docker compose up -d`

Também dá para rodar manualmente: aba **Actions → Docker Image CICD → Run workflow**.

## Verificação

- Docker Hub: a imagem aparece com as tags `latest` e o SHA do commit.
- Na EC2: `docker ps` mostra o container `cesusc-devops-app-1` rodando.
- Navegador: `http://<IP_DA_EC2>:3000/index`.

Comandos úteis na EC2:

```bash
cd /opt/cesusc-devops
docker compose ps
docker compose logs -f
docker compose restart
```

Rollback para uma versão anterior (tag = SHA do commit):

```bash
docker pull <usuario>/cesusc-devops:<sha>
docker tag <usuario>/cesusc-devops:<sha> <usuario>/cesusc-devops:latest
docker compose up -d
```

## Checklist para a aula de 05/11

- [ ] Instância EC2 ligada e `EC2_HOST` com o IP atual
- [ ] Docker instalado na EC2 e PM2 antigo parado
- [ ] Secrets `DOCKERHUB_TOKEN`, `SSH_PRIVATE_KEY`, `EC2_HOST` e variável `DOCKERHUB_USERNAME`
- [ ] Workflow **Docker Image CICD** verde no Actions
- [ ] `http://<IP_DA_EC2>:3000/index` abrindo no navegador
