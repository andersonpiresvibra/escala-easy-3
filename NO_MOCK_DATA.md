# Diretriz Rígida: Proibição de Dados Simulados e Uso Exclusivo de Banco de Dados

Este documento estabelece a regra máxima para o desenvolvimento e manutenção do sistema **Escala Easy VIBRA**.

---

## 🚨 REGRA SUPREMA DE INTEGRIDADE DE DADOS
**O sistema deve operar única e exclusivamente com os dados reais armazenados nas tabelas oficiais do banco de dados.** 

É terminantemente proibido ao código do aplicativo (seja no frontend Angular, em services TypeScript, ou em qualquer outra camada) tomar decisões arbitrárias ("que der na teia"), alterar, ocultar, mapear ou simular informações cadastrais de colaboradores, turnos ou escalas.

---

## 1. Fonte Única da Verdade (Single Source of Truth)

Toda e qualquer informação exibida na interface do usuário deve refletir estritamente os valores retornados pelas tabelas relacionais do banco de dados (Supabase):

1. `colaboradores`: Contém o cadastro e informações pessoais dos colaboradores.
   - **Setores Reais:** O campo `sector` (ex: `Aeródromo`, `Vip`, `Teste`) deve ser exibido exatamente como está no banco de dados. É proibido normalizar ou substituir esses termos por outros (como "Operacional").
   - **Jornadas Reais:** O campo `schedule` (ex: `8h45`, `21:12 - 06:00`, `22:00 - 07:00`) representa a jornada contratual específica de cada colaborador e deve ser exibido de forma fiel na interface. Nunca sobressaia esses dados com horários fixos baseados apenas no turno genérico.
2. `escala_diaria`: Contém as alocações diárias de trabalho e folga para o mês.
3. `sigla_types`: Contém as siglas de afastamento e folgas corporativas.
4. `shift_types`: Contém as definições dos turnos configurados no planejamento.
5. `audit_history`: Contém os logs de auditoria.

---

## 2. Proibições Absolutas

* **Proibido Normalizar Setores Arbitrariamente:** Não altere o valor do setor no código (por exemplo, transformando `"Aeródromo"` ou `"AERODROMO"` em `"Operacional"`). O setor cadastrado pelo administrador no banco de dados é soberano.
* **Proibido Sobrescrever Horários Contratuais:** Não utilize horários de turno genéricos se o colaborador possui uma jornada específica cadastrada no campo `schedule` da tabela `colaboradores`. Use os dados da tabela diretamente.
* **Proibido Mocks e Dados Fictícios:** É estritamente vedada a criação de listas estáticas de colaboradores, siglas não cadastradas ou turnos de teste que não pertençam ao banco de dados relacional.
* **Proibida a Tomada de Decisões Unilaterais pelo Código:** Se um novo colaborador ou setor for inserido, a interface e os filtros devem se adaptar dinamicamente de forma automática, lendo os dados diretamente do banco de dados relacional, sem necessidade de ajustes manuais de mapeamento no código.

---

**Esta diretriz é inegociável e deve ser lida por qualquer modelo de IA ou desenvolvedor humano antes de iniciar qualquer alteração neste repositório.**
