# PRD — Finanças em Dia

## Visão do produto

**Finanças em Dia** é um organizador pessoal de finanças simples, em português, que ajuda pessoas a registrar receitas e despesas em segundos e enxergar para onde o dinheiro está indo. A experiência prioriza clareza, poucos passos e privacidade local, sem exigir cadastro.

## Problema

Muitas pessoas deixam de acompanhar as próprias finanças porque ferramentas tradicionais parecem complicadas, exigem muitos passos ou tornam a organização uma tarefa pesada. Sem uma visão clara das entradas, saídas e categorias, fica difícil decidir onde ajustar os gastos e quanto guardar.

## Público-alvo

Pessoas que querem começar ou voltar a organizar a vida financeira, especialmente iniciantes que valorizam uma experiência leve, direta e acessível pelo celular.

## Objetivo do MVP

Permitir que uma pessoa registre uma movimentação manual rapidamente e veja, no mesmo painel, o saldo geral, os totais do mês, a composição das despesas e o progresso de uma meta de economia.

## Requisitos funcionais

1. Exibir três indicadores: saldo atual (receitas menos despesas cadastradas), receitas do mês e despesas do mês.
2. Permitir criar uma transação com descrição, valor em reais, tipo (receita ou despesa), categoria e data.
3. Oferecer as categorias Moradia, Alimentação, Transporte, Lazer, Saúde, Educação, Salário e Outros.
4. Listar transações do mês selecionado, ordenadas da mais recente para a mais antiga, e permitir excluir cada item.
5. Filtrar a lista por mês, tipo e categoria e buscar pelo texto da descrição.
6. Exibir gráfico de rosca de despesas por categoria e gráfico de barras comparando receitas e despesas nos seis meses que terminam no mês selecionado.
7. Exibir uma meta mensal de economia, seu progresso e o valor faltante; permitir editar o valor da meta.
8. Persistir transações e meta no `localStorage`, sem login, backend ou envio de dados a um servidor.
9. Iniciar com cinco transações de exemplo apenas quando ainda não houver dados salvos.

## Requisitos de experiência e tecnologia

- Interface responsiva, mobile-first, em português do Brasil.
- Visual moderno e limpo, com cartões brancos arredondados, fundo claro, verde para receitas e vermelho/coral para despesas.
- Formatação de moeda em Real brasileiro (R$) e datas em formato brasileiro.
- Stack: React, TypeScript, Tailwind CSS, Vite, Recharts e Lucide React.
- Ações principais utilizáveis por teclado, rótulos acessíveis e estados vazios explicativos.

## Critérios de aceite

- É possível abrir o modal, registrar uma receita ou despesa válida e ver o painel, os gráficos e a lista atualizarem.
- Dados continuam presentes após recarregar a página no mesmo navegador.
- Filtros de mês, tipo e categoria podem ser combinados e limpos.
- Uma transação pode ser excluída.
- Meta de economia pode ser alterada e o progresso recalculado.
- Em primeiro acesso, são exibidas cinco movimentações de exemplo do mês atual; em acessos seguintes, os dados salvos são respeitados.
- O layout funciona em telas pequenas e grandes sem exigir login.

## Limites e decisões do MVP

- Os dados ficam apenas no armazenamento local do navegador e não são sincronizados entre aparelhos nem protegidos por conta.
- Receitas e despesas são cadastradas manualmente; não há conexão bancária, importação de extratos ou classificação automática.
- A meta representa a diferença positiva entre receitas e despesas cadastradas no mês; se não houver saldo positivo, o progresso permanece em 0%.
- Os exemplos iniciais são demonstração e podem ser excluídos.

## Prompt final (PRD usado como instrução de construção)

> Crie um aplicativo web moderno chamado “Finanças em Dia”, em React + TypeScript + Tailwind CSS, para organização simples de finanças pessoais. O problema é que muitas pessoas não mantêm controle porque os apps são complicados; a solução deve permitir registrar receita ou despesa em poucos segundos e mostrar para onde o dinheiro vai. Faça um dashboard mobile-first e responsivo com três cards — Saldo Atual, Receitas do Mês e Despesas do Mês — e botão “+ Nova Transação” que abre um modal com descrição, valor em R$, tipo (Receita/Despesa), categoria (Moradia, Alimentação, Transporte, Lazer, Saúde, Educação, Salário, Outros) e data. Mostre uma lista de transações filtrável por mês, tipo e categoria, com ação para excluir. Inclua um gráfico de pizza/rosca de despesas por categoria, um gráfico de barras de receitas vs despesas e uma meta mensal de economia com barra de progresso editável. Persista os dados em localStorage, sem login, e inicialize com cinco transações de exemplo somente na primeira abertura. Use interface clara, limpa e acessível, cartões brancos arredondados, verde para receitas e vermelho/coral para despesas, textos em português do Brasil e valores em reais. Não use a imagem de referência como asset nem copie elementos proprietários; use-a apenas como inspiração visual. Inclua estados vazios, validação de formulário e instruções de execução local no README.
