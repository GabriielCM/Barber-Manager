# Barber Manager

Sistema completo de gestão para barbearia desenvolvido com Nest.js, Next.js, Prisma e PostgreSQL.

## Stack Tecnológico

- **Backend:** Nest.js + TypeScript
- **Frontend:** Next.js 14 + React + TailwindCSS
- **ORM:** Prisma
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (Admin e Usuário)
- **Documentação:** Swagger

## Funcionalidades

### Módulo de Clientes
- Cadastro completo (nome, telefone, email, data de nascimento, observações)
- Status (ativo, inativo, banido, inadimplente)
- Histórico de atendimentos e compras
- Estatísticas (ticket médio, frequência, total gasto)
- Busca rápida por nome ou telefone
- Listagem de clientes VIP e inativos

### Módulo de Barbeiros
- Cadastro com especialidades
- Dashboard individual com estatísticas
- Relatório de receita e atendimentos
- Serviços mais executados

### Módulo de Serviços
- Cadastro com nome, descrição, preço e duração
- Vinculação com barbeiros
- Controle de serviços ativos/inativos

### Módulo de Produtos
- Cadastro com categorias
- Controle de estoque automático
- Alertas de estoque baixo
- Histórico de movimentações (entradas/saídas)
- Cálculo de margem de lucro

### Módulo de Agendamentos
- Criação com cliente, barbeiro, serviço, data/hora
- Status (agendado, em andamento, concluído, cancelado, não compareceu)
- Verificação de conflitos de horário
- Bloqueio para clientes banidos/inadimplentes
- Visualização por dia

### Módulo de Checkout
- Modificação do serviço principal
- Adição de serviços extras
- Adição de produtos
- Desconto (valor ou percentual)
- Múltiplas formas de pagamento
- Baixa automática de estoque
- Atualização do histórico do cliente

### Módulo Financeiro
- Registro de entradas e saídas
- Fluxo de caixa diário, semanal e mensal
- Relatórios por barbeiro, cliente e serviço
- Dashboard com estatísticas

## Estrutura do Projeto

```
/backend
  /prisma           # Schema e migrações
  /src
    /auth           # Autenticação JWT
    /clients        # Módulo de clientes
    /barbers        # Módulo de barbeiros
    /services       # Módulo de serviços
    /products       # Módulo de produtos
    /appointments   # Módulo de agendamentos
    /checkout       # Módulo de checkout
    /financial      # Módulo financeiro
    /prisma         # Prisma service
    /common         # Decorators, guards, etc.

/frontend
  /src
    /app            # Páginas (App Router)
    /components     # Componentes React
    /lib            # API client
    /store          # Zustand store
    /types          # TypeScript types
```

## Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações de banco de dados

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Popular banco com dados iniciais
npm run prisma:seed

# Iniciar servidor
npm run start:dev
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

## Acessando o Sistema

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api
- **Swagger:** http://localhost:3001/api/docs

### Credenciais de Teste

```
Email: admin@barber.com
Senha: admin123
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Perfil do usuário

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Buscar cliente
- `GET /api/clients/:id/history` - Histórico do cliente
- `GET /api/clients/search` - Busca rápida
- `GET /api/clients/vip` - Clientes VIP
- `GET /api/clients/inactive` - Clientes inativos
- `POST /api/clients` - Criar cliente
- `PATCH /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente

### Barbeiros
- `GET /api/barbers` - Listar barbeiros
- `GET /api/barbers/:id` - Buscar barbeiro
- `GET /api/barbers/:id/dashboard` - Dashboard do barbeiro
- `GET /api/barbers/available` - Barbeiros disponíveis
- `POST /api/barbers` - Criar barbeiro
- `PATCH /api/barbers/:id` - Atualizar barbeiro
- `POST /api/barbers/:id/services/:serviceId` - Vincular serviço
- `DELETE /api/barbers/:id/services/:serviceId` - Desvincular serviço
- `DELETE /api/barbers/:id` - Desativar barbeiro

### Serviços
- `GET /api/services` - Listar serviços
- `GET /api/services/:id` - Buscar serviço
- `GET /api/services/popular` - Serviços populares
- `GET /api/services/barber/:barberId` - Serviços do barbeiro
- `POST /api/services` - Criar serviço
- `PATCH /api/services/:id` - Atualizar serviço
- `DELETE /api/services/:id` - Desativar serviço

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Buscar produto
- `GET /api/products/low-stock` - Estoque baixo
- `GET /api/products/:id/movements` - Movimentações
- `GET /api/products/categories` - Categorias
- `POST /api/products` - Criar produto
- `POST /api/products/categories` - Criar categoria
- `POST /api/products/:id/stock` - Movimentar estoque
- `PATCH /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Desativar produto

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `GET /api/appointments/:id` - Buscar agendamento
- `GET /api/appointments/today` - Agendamentos de hoje
- `GET /api/appointments/upcoming` - Próximos agendamentos
- `GET /api/appointments/calendar` - Visualização calendário
- `POST /api/appointments` - Criar agendamento
- `POST /api/appointments/:id/start` - Iniciar atendimento
- `PATCH /api/appointments/:id` - Atualizar agendamento
- `DELETE /api/appointments/:id` - Cancelar agendamento

### Checkout
- `GET /api/checkout` - Listar checkouts
- `GET /api/checkout/:id` - Buscar checkout
- `GET /api/checkout/:id/receipt` - Gerar recibo
- `POST /api/checkout` - Finalizar checkout
- `DELETE /api/checkout/:id` - Cancelar checkout

### Financeiro
- `GET /api/financial/transactions` - Listar transações
- `GET /api/financial/dashboard` - Dashboard
- `GET /api/financial/cash-flow/daily` - Fluxo diário
- `GET /api/financial/cash-flow/weekly` - Fluxo semanal
- `GET /api/financial/cash-flow/monthly` - Fluxo mensal
- `GET /api/financial/reports/barber` - Relatório por barbeiro
- `GET /api/financial/reports/client` - Relatório por cliente
- `GET /api/financial/reports/service` - Relatório por serviço
- `POST /api/financial/transactions` - Criar transação
- `DELETE /api/financial/transactions/:id` - Excluir transação

## Fluxo Principal

1. **Agendamento:** Cliente agenda um serviço com um barbeiro
2. **Atendimento:** Barbeiro inicia o atendimento
3. **Checkout:** Ao finalizar, são adicionados serviços/produtos, aplicados descontos e registrado pagamento
4. **Financeiro:** Transação é registrada automaticamente
5. **Estoque:** Produtos vendidos são baixados do estoque
6. **Cliente:** Histórico e estatísticas são atualizados

## Licença

MIT
