export interface Debt {
  from: string
  to: string
  amount: number
}

const CURRENCY_EPSILON = 0.01

export function minimizeTransactions(balances: Map<string, number>): Debt[] {
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  balances.forEach((amount, id) => {
    if (amount < -CURRENCY_EPSILON) debtors.push({ id, amount: Math.abs(amount) })
    else if (amount > CURRENCY_EPSILON) creditors.push({ id, amount })
  })

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const debts: Debt[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount)
    if (transfer > CURRENCY_EPSILON) {
      debts.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: Math.round(transfer * 100) / 100,
      })
    }
    debtors[i].amount -= transfer
    creditors[j].amount -= transfer
    if (debtors[i].amount < CURRENCY_EPSILON) i++
    if (creditors[j].amount < CURRENCY_EPSILON) j++
  }

  return debts
}

export function generateVenmoLink(recipient: string, amount: number, note: string): string {
  return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(recipient)}&amount=${amount}&note=${encodeURIComponent(note)}`
}

export function generateCashAppLink(recipient: string, amount: number, note: string): string {
  return `https://cash.app/$${encodeURIComponent(recipient)}/${amount}?note=${encodeURIComponent(note)}`
}
