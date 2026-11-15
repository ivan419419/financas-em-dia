import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Edit3,
  FilterX,
  LayoutDashboard,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TransactionType = 'income' | 'expense'
type Transaction = {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: string
  date: string
}

const STORAGE_KEY = 'financas-em-dia:transactions:v1'
const GOAL_KEY = 'financas-em-dia:monthly-goals:v1'
const DEFAULT_GOAL = 1200
const CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Outros']
const CATEGORY_COLORS: Record<string, string> = {
  Moradia: '#52735a',
  Alimentação: '#8cac72',
  Transporte: '#c7a665',
  Lazer: '#86a9a0',
  Saúde: '#d58c78',
  Educação: '#8a83b2',
  Salário: '#4b8e70',
  Outros: '#b0b8aa',
}

function localDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function safeRead(key: string) {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeWrite(key: string, value: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value)
  } catch {
    // O app continua utilizável em memória se o navegador bloquear o armazenamento.
  }
}

function parseBrazilianAmount(raw: string) {
  const cleaned = raw.trim().replace(/\s|R\$/gi, '')
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned
  return Number(normalized)
}

function monthDate(monthKey: string, day: number) {
  const [year, month] = monthKey.split('-').map(Number)
  return localDateString(new Date(year, month - 1, day))
}

function sampleTransactions(monthKey: string): Transaction[] {
  return [
    { id: 'sample-salary', description: 'Salário', amount: 5200, type: 'income', category: 'Salário', date: monthDate(monthKey, 1) },
    { id: 'sample-home', description: 'Aluguel', amount: 1650, type: 'expense', category: 'Moradia', date: monthDate(monthKey, 5) },
    { id: 'sample-market', description: 'Compras do mercado', amount: 428.7, type: 'expense', category: 'Alimentação', date: monthDate(monthKey, 8) },
    { id: 'sample-transport', description: 'Transporte', amount: 126.4, type: 'expense', category: 'Transporte', date: monthDate(monthKey, 11) },
    { id: 'sample-leisure', description: 'Cinema e jantar', amount: 185.9, type: 'expense', category: 'Lazer', date: monthDate(monthKey, 14) },
  ]
}

function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.description === 'string'
    && item.description.length > 0
    && typeof item.amount === 'number'
    && Number.isFinite(item.amount)
    && item.amount > 0
    && (item.type === 'income' || item.type === 'expense')
    && typeof item.category === 'string'
    && CATEGORIES.includes(item.category)
    && typeof item.date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    && !Number.isNaN(Date.parse(`${item.date}T00:00:00`))
}

function loadTransactions(): Transaction[] {
  const saved = safeRead(STORAGE_KEY)
  if (saved === null) return sampleTransactions(currentMonthKey())
  try {
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return sampleTransactions(currentMonthKey())
    const valid = parsed.filter(isTransaction)
    return parsed.length > 0 && valid.length === 0 ? sampleTransactions(currentMonthKey()) : valid
  } catch {
    // Se o armazenamento local estiver inválido, inicia com os exemplos.
    return sampleTransactions(currentMonthKey())
  }
}

type MonthlyGoals = Record<string, number>

function loadMonthlyGoals(): MonthlyGoals {
  try {
    const saved = safeRead(GOAL_KEY)
    if (!saved) return {}
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed)
      .filter(([month, value]) => /^\d{4}-\d{2}$/.test(month) && typeof value === 'number' && Number.isFinite(value) && value > 0))
  } catch {
    return {}
  }
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function shortMoney(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return money(value)
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(year, month - 1, day))
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function currentDateLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
}

function lastSixMonths(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - 1 - (5 - index), 1)
    return {
      key: currentMonthKey(date),
      label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
    }
  })
}

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey())
  const [goalsByMonth, setGoalsByMonth] = useState<MonthlyGoals>(loadMonthlyGoals)
  const goal = goalsByMonth[selectedMonth] ?? DEFAULT_GOAL
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [goalEditing, setGoalEditing] = useState(false)
  const [goalDraft, setGoalDraft] = useState(String(goal))
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'Alimentação',
    date: localDateString(new Date()),
  })

  useEffect(() => {
    safeWrite(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    safeWrite(GOAL_KEY, JSON.stringify(goalsByMonth))
  }, [goalsByMonth])

  useEffect(() => {
    setGoalDraft(String(goalsByMonth[selectedMonth] ?? DEFAULT_GOAL))
    setGoalEditing(false)
  }, [selectedMonth, goalsByMonth])

  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(selectedMonth)),
    [transactions, selectedMonth],
  )
  const income = monthTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenses = monthTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const balance = transactions.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0)
  const savedThisMonth = Math.max(income - expenses, 0)
  const goalProgress = Math.min((savedThisMonth / goal) * 100, 100)

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    return monthTransactions
      .filter((item) => typeFilter === 'all' || item.type === typeFilter)
      .filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
      .filter((item) => !query || item.description.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [monthTransactions, typeFilter, categoryFilter, search])

  const expenseByCategory = useMemo(() => {
    const grouped = new Map<string, number>()
    monthTransactions.filter((item) => item.type === 'expense').forEach((item) => {
      grouped.set(item.category, (grouped.get(item.category) ?? 0) + item.amount)
    })
    return Array.from(grouped, ([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS.Outros }))
      .sort((a, b) => b.value - a.value)
  }, [monthTransactions])

  const comparisonData = useMemo(() => lastSixMonths(selectedMonth).map(({ key, label }) => {
    const month = transactions.filter((item) => item.date.startsWith(key))
    return {
      month: label,
      receitas: month.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
      despesas: month.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
    }
  }), [transactions, selectedMonth])

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = parseBrazilianAmount(form.amount)
    if (!form.description.trim()) return setFormError('Escreva uma descrição para a transação.')
    if (!Number.isFinite(amount) || amount <= 0) return setFormError('Informe um valor maior que zero.')
    if (!form.date) return setFormError('Escolha a data da transação.')
    setTransactions((current) => [{
      id: crypto.randomUUID(),
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      date: form.date,
    }, ...current])
    setSelectedMonth(form.date.slice(0, 7))
    setTypeFilter('all')
    setCategoryFilter('all')
    setSearch('')
    setForm({ description: '', amount: '', type: 'expense', category: 'Alimentação', date: localDateString(new Date()) })
    setFormError('')
    setModalOpen(false)
  }

  function deleteTransaction(id: string) {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id))
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = parseBrazilianAmount(goalDraft)
    if (Number.isFinite(value) && value > 0) {
      setGoalsByMonth((current) => ({ ...current, [selectedMonth]: value }))
      setGoalEditing(false)
    }
  }

  function changeType(type: TransactionType) {
    setForm((current) => ({ ...current, type, category: type === 'income' ? 'Salário' : 'Alimentação' }))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Finanças em Dia — início">
          <span className="brand-mark"><Wallet size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">finanças<span>em dia</span></span>
        </a>
        <div className="nav-label">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <a className="nav-link active" href="#inicio"><LayoutDashboard size={18} /> <span>Visão geral</span></a>
          <a className="nav-link" href="#transacoes"><CreditCard size={18} /> <span>Transações</span></a>
          <a className="nav-link" href="#meta"><TrendingUp size={18} /> <span>Minha meta</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="side-tip">
            <span className="tip-icon"><Sparkles size={16} /></span>
            <p>Pequenos passos também levam longe.</p>
            <span>Seu futuro agradece.</span>
          </div>
          <a className="help-link" href="#sobre"><CircleHelp size={16} /> Como funciona</a>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark"><Wallet size={19} /></span>
            <span className="brand-name">finanças<span>em dia</span></span>
          </div>
          <div className="topbar-note"><span className="status-dot" /> Seus dados ficam só neste dispositivo</div>
          <button className="top-icon-button" type="button" aria-label="Informações de privacidade" title="Sem login: seus dados ficam no navegador"><CircleHelp size={18} /></button>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{currentDateLabel()}</p>
              <h1>Seu dinheiro, <span>mais fácil.</span></h1>
              <p className="welcome-copy">Um olhar simples para cuidar bem do que é seu.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
              <Plus size={19} strokeWidth={2.5} /> <span>Nova transação</span>
            </button>
          </section>

          <section className="summary-grid" aria-label="Resumo financeiro">
            <article className="summary-card balance-card">
              <div className="summary-top"><span>Saldo atual</span><span className="summary-icon balance-icon"><Wallet size={17} /></span></div>
              <p className={`summary-value ${balance < 0 ? 'negative-value' : ''}`}>{money(balance)}</p>
              <p className="summary-foot"><span className="mini-indicator"><TrendingUp size={13} /></span> Saldo de todas as transações</p>
            </article>
            <article className="summary-card">
              <div className="summary-top"><span>Receitas do mês</span><span className="summary-icon income-icon"><ArrowDownLeft size={17} /></span></div>
              <p className="summary-value income-value">{money(income)}</p>
              <p className="summary-foot"><span className="mini-indicator income-indicator"><TrendingUp size={13} /></span> {monthLabel(selectedMonth)}</p>
            </article>
            <article className="summary-card">
              <div className="summary-top"><span>Despesas do mês</span><span className="summary-icon expense-icon"><ArrowUpRight size={17} /></span></div>
              <p className="summary-value expense-value">{money(expenses)}</p>
              <p className="summary-foot"><span className="mini-indicator expense-indicator"><TrendingDown size={13} /></span> {monthLabel(selectedMonth)}</p>
            </article>
          </section>

          <section className="insights-grid" aria-label="Análises financeiras">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div><h2>Despesas por categoria</h2><p>Entenda para onde vai seu dinheiro</p></div>
                <span className="panel-month"><CalendarDays size={14} /> {monthLabel(selectedMonth).split(' de ')[0]}</span>
              </div>
              {expenseByCategory.length ? (
                <div className="pie-content">
                  <div className="pie-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius="63%" outerRadius="88%" paddingAngle={3} stroke="none">
                          {expenseByCategory.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, border: '1px solid #edf0ea', boxShadow: '0 8px 24px #20302014', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center"><span>Total no mês</span><strong>{shortMoney(expenses)}</strong></div>
                  </div>
                  <div className="category-legend">
                    {expenseByCategory.map((item) => (
                      <div className="legend-row" key={item.name}>
                        <span className="legend-label"><i style={{ backgroundColor: item.color }} />{item.name}</span>
                        <span className="legend-value">{money(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <div className="chart-empty"><span className="empty-chart-icon"><TrendingDown size={20} /></span><strong>Nenhuma despesa ainda</strong><span>Suas despesas vão aparecer aqui.</span></div>}
            </article>

            <article className="panel chart-panel">
              <div className="panel-heading">
                <div><h2>Receitas vs despesas</h2><p>Seus últimos 6 meses</p></div>
                <span className="chart-key"><i className="key-income" /> Receita <i className="key-expense" /> Despesa</span>
              </div>
              <div className="bar-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 13, right: 8, bottom: 0, left: -14 }} barGap={5}>
                    <CartesianGrid stroke="#edf0ea" vertical={false} strokeDasharray="3 5" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#92998f', fontSize: 11 }} dy={9} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a0a69e', fontSize: 10 }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                    <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ borderRadius: 12, border: '1px solid #edf0ea', boxShadow: '0 8px 24px #20302014', fontSize: 12 }} />
                    <Bar dataKey="receitas" name="Receitas" fill="#73977b" radius={[5, 5, 0, 0]} maxBarSize={19} />
                    <Bar dataKey="despesas" name="Despesas" fill="#d88976" radius={[5, 5, 0, 0]} maxBarSize={19} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer"><span><i className="footer-dot green-dot" /> Entradas</span><span><i className="footer-dot coral-dot" /> Saídas</span><span className="chart-footer-note">por mês</span></div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel transactions-panel" id="transacoes">
              <div className="transactions-heading">
                <div><h2>Transações</h2><p>Veja tudo o que entrou e saiu</p></div>
                <span className="transaction-count">{filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="filter-row">
                <label className="month-filter" aria-label="Filtrar mês"><CalendarDays size={15} /><input aria-label="Filtrar mês" type="month" value={selectedMonth} onChange={(event) => { if (event.target.value) setSelectedMonth(event.target.value) }} /></label>
                <label className="select-filter"><span className="sr-only">Filtrar tipo</span><select aria-label="Filtrar tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Todos os tipos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select><ChevronDown size={14} /></label>
                <label className="select-filter category-select"><span className="sr-only">Filtrar categoria</span><select aria-label="Filtrar categoria" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Todas categorias</option>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><ChevronDown size={14} /></label>
                <label className="search-filter"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" aria-label="Buscar transação" /></label>
                {(typeFilter !== 'all' || categoryFilter !== 'all' || search) && <button type="button" className="clear-filters" aria-label="Limpar filtros" onClick={() => { setTypeFilter('all'); setCategoryFilter('all'); setSearch('') }}><FilterX size={15} /></button>}
              </div>
              <div className="transaction-list">
                {filteredTransactions.length ? filteredTransactions.map((transaction) => {
                  const categoryClass = transaction.category.toLowerCase().replace(/ç/g, 'c').replace(/ã/g, 'a').replace(/\s+/g, '-')
                  return (
                    <div className="transaction-row" key={transaction.id}>
                      <span className={`transaction-avatar ${transaction.type === 'income' ? 'avatar-income' : `avatar-${categoryClass}`}`}>
                        {transaction.type === 'income' ? <ArrowDownLeft size={17} /> : <ArrowDownRight size={17} />}
                      </span>
                      <div className="transaction-info"><strong>{transaction.description}</strong><span>{transaction.category} <i>·</i> {formatDate(transaction.date)}</span></div>
                      <span className={`transaction-amount ${transaction.type === 'income' ? 'income-value' : 'expense-value'}`}>{transaction.type === 'income' ? '+' : '−'} {money(transaction.amount)}</span>
                      <button className="delete-button" type="button" onClick={() => deleteTransaction(transaction.id)} aria-label={`Excluir ${transaction.description}`} title="Excluir transação"><Trash2 size={16} /></button>
                    </div>
                  )
                }) : <div className="list-empty"><span className="empty-list-icon"><Search size={18} /></span><strong>Nada por aqui</strong><span>Não encontramos transações para este período e filtros.</span></div>}
              </div>
            </article>

            <article className="panel goal-panel" id="meta">
              <div className="goal-topline"><span className="goal-icon"><Sparkles size={17} /></span><span className="goal-tag">SEU PLANO DO MÊS</span><button type="button" className="edit-goal" onClick={() => { setGoalDraft(String(goal)); setGoalEditing((editing) => !editing) }} aria-label="Editar meta de economia" title="Editar meta"><Edit3 size={16} /></button></div>
              <h2>Meta de economia</h2>
              <p className="goal-description">Guardar um pouquinho hoje faz diferença amanhã.</p>
              <div className="goal-amount-row"><strong>{money(savedThisMonth)}</strong><span>de {money(goal)}</span></div>
              <div className="progress-track" role="progressbar" aria-label="Progresso da meta de economia" aria-valuenow={Math.round(goalProgress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${goalProgress}%` }} /></div>
              <div className="goal-foot"><span>{Math.round(goalProgress)}% concluído</span><span>{goalProgress >= 100 ? 'Meta alcançada!' : `Faltam ${money(Math.max(goal - savedThisMonth, 0))}`}</span></div>
              {goalEditing && <form className="goal-edit-form" onSubmit={saveGoal}><label htmlFor="goal-value">Nova meta mensal</label><div><span>R$</span><input id="goal-value" type="number" min="1" step="0.01" value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} required /><button type="submit" aria-label="Salvar meta"><Check size={16} /></button><button type="button" aria-label="Cancelar edição" onClick={() => setGoalEditing(false)}><X size={16} /></button></div></form>}
              <div className="goal-note"><span className="goal-note-icon"><TrendingUp size={15} /></span><span>Economizar é um hábito. Você está no caminho!</span></div>
            </article>
          </section>

          <footer className="page-footer" id="sobre"><span>Feito para deixar a vida financeira mais leve.</span><span><span className="privacy-lock">●</span> Seus dados são salvos apenas neste navegador.</span></footer>
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setModalOpen(false); setFormError('') } }}>
        <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><span className="modal-kicker">MOVIMENTAÇÃO</span><h2 id="modal-title">Nova transação</h2></div><button type="button" className="modal-close" onClick={() => { setModalOpen(false); setFormError('') }} aria-label="Fechar"><X size={19} /></button></div>
          <p className="modal-copy">Registre em segundos e mantenha tudo em dia.</p>
          <form onSubmit={addTransaction}>
            <div className="type-toggle" role="group" aria-label="Tipo da transação"><button type="button" className={form.type === 'expense' ? 'selected expense-selected' : ''} onClick={() => changeType('expense')}><ArrowUpRight size={16} /> Despesa</button><button type="button" className={form.type === 'income' ? 'selected income-selected' : ''} onClick={() => changeType('income')}><ArrowDownLeft size={16} /> Receita</button></div>
            <label className="form-field">Descrição<input autoFocus type="text" maxLength={80} placeholder="Ex.: conta de luz" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required /></label>
            <label className="form-field">Valor (R$)<div className="amount-input"><span>R$</span><input type="text" inputMode="decimal" placeholder="0,00" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required /></div></label>
            <label className="form-field">Categoria<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="form-field">Data<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></label>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="primary-button modal-submit" type="submit"><Plus size={18} /> Salvar transação</button>
            <p className="modal-privacy">Sem cadastro. Seus dados ficam guardados neste dispositivo.</p>
          </form>
        </section>
      </div>}
    </div>
  )
}

export default App
