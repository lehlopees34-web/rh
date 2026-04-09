# Sistema de RH e DRE

Estrutura inicial de um sistema completo para gestao de RH e financeiro, com separacao entre backend, frontend e banco de dados.

## Modulos previstos

- Cadastro de funcionarios
- Folha de pagamento automatizada
- Beneficios
- Banco de horas
- Controle de ferias
- Explicacao automatica de holerite
- Relatorios financeiros (DRE)

## Estrutura

```text
projeto_app/
  apps/
    api/        # Backend Express + Prisma + SQLite
    web/        # Frontend React + Vite
```

## Como executar

1. Instale o Node.js 20+.
2. Na raiz do projeto, execute:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

3. URLs esperadas:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3333`

## SQLite no Replit

- O Prisma usa SQLite com caminho relativo ao arquivo [schema.prisma](C:\Users\DELL\OneDrive\Documentos\projeto_app\apps\api\prisma\schema.prisma).
- O valor recomendado para `DATABASE_URL` e `file:./dev.db`, que gera o banco em `apps/api/prisma/dev.db`.
- Os scripts `npm run db:generate`, `npm run db:push` e `npm run db:seed` agora preparam automaticamente o `.env` do backend e garantem que o diretorio do SQLite exista antes de rodar o Prisma.
- Se estiver usando Replit Secrets, defina `DATABASE_URL=file:./dev.db`.

## Observacoes

- O projeto usa SQLite para acelerar a fase inicial.
- Os dados da interface possuem fallback local para facilitar a primeira execucao.
- O schema do banco ja contempla as entidades principais de RH e DRE.
- O cadastro de funcionarios ja possui persistencia via Prisma no endpoint `/api/employees`.
- A folha automatica considera salario base, adicional noturno, hora extra 50% e 100%, vale transporte, plano de saude, dependentes, INSS e IRRF.
- A estrutura para o futuro botao `explicar holerite` foi deixada pronta no endpoint `/api/payroll/:employeeId/explanation`.
