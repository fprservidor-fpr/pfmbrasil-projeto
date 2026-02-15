# 🚀 Guia Rápido de Deploy na Vercel

## ✅ Checklist Pré-Deploy

- [x] Código preparado com imports corretos do Tailwind
- [x] `.gitignore` configurado para não enviar `.env.local`
- [x] `.env.example` criado como referência
- [x] `package.json` com script de build configurado
- [x] README.md com documentação completa

## 📋 Passos para Deploy

### 1. Fazer Push para o Git

```bash
# Se ainda não iniciou um repositório Git
git init
git add .
git commit -m "Initial commit - preparar para deploy Vercel"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU-USUARIO/pfmbrasil-projeto.git
git branch -M main
git push -u origin main
```

### 2. Deploy na Vercel

**Opção A: Via Dashboard Web**
1. Acesse https://vercel.com/new
2. Clique em "Import Project"
3. Selecione seu repositório do GitHub
4. Configure as variáveis de ambiente (passo 3)
5. Clique em "Deploy"

**Opção B: Via CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Seguir as instruções interativas
```

### 3. Configurar Variáveis de Ambiente na Vercel

⚠️ **MUITO IMPORTANTE**: Adicione estas variáveis no painel da Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://mrlzrjhjdwfdhaodyztj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybHpyamhqZHdmZGhhb2R5enRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDg1MTksImV4cCI6MjA4MjcyNDUxOX0.4vPr0Hjgod-fkKP5jtpl2l7Nt1IPVPgRZXr2PMtHDx0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybHpyamhqZHdmZGhhb2R5enRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE0ODUxOSwiZXhwIjoyMDgyNzI0NTE5fQ.8uveA5rWzZyng5wllMSYUk2-qiB3ox9kHjHucBCIjIA
DATABASE_URL=postgresql://postgres.mrlzrjhjdwfdhaodyztj:z4szHtHjlovpKjZOALlsdfYYPWfLIQyaDkjlewE1vJ22u38ELBlMblm68dKAlBB9@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Como adicionar:**
1. No dashboard da Vercel, vá para o projeto
2. Settings > Environment Variables
3. Adicione cada variável
4. Marque todos os ambientes (Production, Preview, Development)
5. Clique em "Save"

### 4. Configurações Adicionais do Next.js na Vercel

No arquivo `next.config.ts`, a configuração `allowedOrigins` em `serverActions` pode precisar ser atualizada com o domínio da Vercel:

```typescript
experimental: {
  serverActions: {
    allowedOrigins: [
      'your-project.vercel.app',
      '*.vercel.app'
    ]
  }
}
```

Isso pode ser feito após o primeiro deploy quando você souber a URL.

### 5. Verificar Deploy

Após o deploy:
- ✅ Verifique se o build foi concluído com sucesso
- ✅ Acesse a URL fornecida pela Vercel
- ✅ Teste o login
- ✅ Verifique se as páginas carregam
- ✅ Teste a conexão com o Supabase

## 🎯 Deploy Automático

Após o primeiro deploy, a Vercel automaticamente:
- ✅ Faz deploy de cada push na branch `main` (produção)
- ✅ Cria preview deploys para pull requests
- ✅ Mostra build logs em tempo real

## 🔄 Redesploy Manual

Se precisar fazer redesploy:
1. Vá para o projeto na Vercel
2. Aba "Deployments"
3. Clique nos três pontos do deploy desejado
4. Clique em "Redeploy"

## 🐛 Troubleshooting

### Build falha com erro de Tailwind
✅ **Já corrigido!** Os imports estão configurados corretamente para funcionar na Vercel.

### Erro 500 após deploy
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique os logs na aba "Deployments" > "Build Logs"

### Conexão com Supabase falha
- Verifique se as URLs e chaves estão corretas
- Confirme que o projeto Supabase está ativo

## 📞 Links Úteis

- Dashboard Vercel: https://vercel.com/dashboard
- Documentação Vercel: https://vercel.com/docs
- Status Vercel: https://www.vercel-status.com/

---

**Pronto para deploy! 🚀**
