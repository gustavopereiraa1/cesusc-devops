FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /opt/cesusc-devops

# Copia primeiro só os manifestos para aproveitar o cache das dependências
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copia o código da aplicação
COPY src/ src/

ENV NODE_ENV=production

# Porta usada pelo Express (src/app.js)
EXPOSE 3000

CMD ["npm", "start"]
