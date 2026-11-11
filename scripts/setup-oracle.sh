#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 INICIANDO PREPARAÇÃO DA MÁQUINA ORACLE CLOUD (BOT CASAL)"
echo "=========================================================="

# 1. Configurar 2GB de memória Swap para garantir estabilidade
echo "📦 Configurando memória Swap de 2GB..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ Swap de 2GB ativado com sucesso!"
else
    echo "ℹ️ Swap já configurado."
fi

# 2. Atualizar repositórios e instalar utilitários
echo "🔄 Atualizando pacotes do sistema..."
sudo apt update -y && sudo apt install -y curl git build-essential

# 3. Instalar Node.js 20 LTS se não existir
if ! command -v node &> /dev/null; then
    echo "⬇️ Instalando Node.js v20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js $(node -v) e NPM $(npm -v) prontos!"

# 4. Instalar PM2 globalmente para manter 24h online
if ! command -v pm2 &> /dev/null; then
    echo "⬇️ Instalando PM2..."
    sudo npm install -g pm2
fi

# 5. Instalar dependências do projeto e gerar Prisma
echo "📦 Instalando dependências do projeto..."
npm install

echo "🗄️ Gerando cliente do Prisma..."
npx prisma generate

echo ""
echo "=========================================================="
echo "🎉 AMBIENTE CONFIGURADO COM SUCESSO!"
echo "=========================================================="
echo "Próximos passos:"
echo "1. Crie seu arquivo .env com: nano .env (cole suas chaves do Neon e Gemini)"
echo "2. Conecte o WhatsApp com: npm run bot"
echo "3. Depois de escanear o QR Code, deixe 24h rodando com: pm2 start \"npm run bot\" --name \"casal-bot\" && pm2 save"
echo "=========================================================="
