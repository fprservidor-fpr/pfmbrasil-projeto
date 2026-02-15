# PFM Brasil - Sistema de Gestão Escolar

Sistema de gestão para o Programa Força Mirim da Fundação Populus Rationabilis.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Repositório Git (GitHub, GitLab ou Bitbucket)
- Banco de dados Supabase configurado

### Passos para Deploy

1. **Push do código para o repositório Git**
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. **Importar projeto na Vercel**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Selecione seu repositório
   - Configure as variáveis de ambiente (veja abaixo)
   - Clique em "Deploy"

3. **Configurar Variáveis de Ambiente**
   
   Na Vercel, vá em Settings > Environment Variables e adicione:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   DATABASE_URL=sua_database_url
   ```
   
   ⚠️ **IMPORTANTE**: Use os mesmos valores do seu arquivo `.env.local`

### Verificação Pós-Deploy

Após o deploy, verifique:
- ✅ Build concluído com sucesso
- ✅ Conexão com Supabase funcionando
- ✅ Páginas carregando corretamente
- ✅ Autenticação funcionando

## 🛠️ Desenvolvimento Local

### Instalação

```bash
npm install
```

### Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

### Rodar Localmente

⚠️ **NOTA IMPORTANTE**: Este projeto tem um problema conhecido com o caractere `#` no caminho do diretório no Windows. 

Se você encontrar erros relacionados a Tailwind CSS com mensagens sobre "null bytes", renomeie a pasta do projeto para remover o `#`:
- ❌ `D:\#PROJETOS-VERCEL\PFMBRASIL-PROJETO`
- ✅ `D:\PROJETOS-VERCEL\PFMBRASIL-PROJETO`

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm run start
```

## 📦 Tecnologias

- **Framework**: Next.js 15.5.7
- **Styling**: Tailwind CSS 4.1.18
- **Database**: Supabase (PostgreSQL)
- **Auth**: Better Auth
- **UI Components**: Radix UI
- **Animations**: Framer Motion

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Verifica problemas de linting
- `npm run typecheck` - Verifica tipos TypeScript

## 📝 Estrutura do Projeto

```
pfmbrasil-projeto/
├── src/
│   ├── app/          # App Router do Next.js
│   ├── components/   # Componentes React
│   └── lib/          # Utilitários e configurações
├── public/           # Arquivos estáticos
└── package.json      # Dependências
```

## 🐛 Problemas Conhecidos

### Erro de Path no Windows
Se você ver erros como:
```
The argument 'path' must be a string... Received 'D:\\\x00#PROJETOS-VERCEL...'
```

**Solução**: Renomeie a pasta do projeto para remover caracteres especiais como `#`.

## 📞 Suporte

Para questões relacionadas ao projeto, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido para Fundação Populus Rationabilis - Programa Força Mirim**
