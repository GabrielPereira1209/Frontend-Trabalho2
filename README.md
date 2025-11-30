# VagasJá - Projeto Frontend Estático

## Descrição Geral

Este repositório contém o **Frontend** do projeto VagasJá. O objetivo é simular uma plataforma de aluguel de vagas de estacionamento, permitindo que usuários busquem vagas, realizem cadastros, visualizem seus aluguéis e gerenciem suas vagas como proprietários.

---

## Requisitos Atendidos

- **Frontend 100% em HTML, CSS e TypeScript:**  
  Todo o código JavaScript foi escrito em TypeScript, compilado para JS.

- **CRUD Simulado:**  
  Todas as operações de Criar, Ler, Atualizar e Deletar (CRUD) são simuladas no frontend.

- **Gerenciamento de Usuários:**  
  Login, cadastro, troca e recuperação de senha, com visões diferentes para usuários comuns e proprietários.

---

- **index.html:** Ponto de entrada do site.
- **pages/**: Cada página representa as páginas do nosso site (login, cadastro, busca, etc).
- **scripts/main.ts:** Toda a lógica do frontend, escrita em TypeScript.
- **styles/main.css:** Estilos globais e responsividade.

---

## Escopo do Site

O site implementa as seguintes funcionalidades:

- **Login e Cadastro:**  
  Autenticação de usuários, com validação de dados e simulação de sessão.

- **Recuperação e Troca de Senha:**  
  Interfaces para redefinir e alterar senha.

- **Busca de Vagas:**  
  Pesquisa de vagas disponíveis, com filtros e exibição de detalhes.

- **Meus Aluguéis:**  
  Visualização dos aluguéis realizados pelo usuário.

- **Minhas Vagas:**  
  Gerenciamento das vagas cadastradas pelo proprietário.

- **Histórico do Proprietário:**  
  Histórico de aluguéis das vagas do proprietário.

- **Perfil:**  
  Visualização e edição dos dados do usuário.

**Visões Diferentes por Usuário:**  
Usuários comuns e proprietários têm acesso a páginas e funcionalidades diferentes, conforme login.

---

## Manual do Usuário

### Instalação e Execução

1. Instale as dependências:
   npm install

2. Compile e sirva o site:
   npm run start

   O site estará disponível em `http://localhost:5173`.


### Fluxo de Uso

- **Login/Cadastro:**  
  Acesse a página de login ou registre-se como novo usuário.

- **Busca de Vagas:**  
  Pesquise vagas disponíveis e simule reservas.

- **Gerenciamento:**  
  - "Meus Aluguéis": Veja suas reservas.
  - "Minhas Vagas": Gerencie suas vagas.
  - "Histórico do Proprietário": Veja o histórico de suas vagas.
  - "Perfil": Edite seus dados.

---

## O que foi implementado e testado

- Navegação entre todas as páginas.
- CRUD completo simulado para vagas e aluguéis (criação, leitura, atualização e exclusão).
- Validação básica de formulários de login, cadastro e edição.
- Busca de vagas com filtros.
- Visualização e edição de perfil.
- Responsividade do layout.
- Simulação de diferentes visões para usuários comuns e proprietários.
- Simulação de troca e recuperação de senha.



