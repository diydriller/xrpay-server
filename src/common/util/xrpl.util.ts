export type BalanceChange = {
  currency: string;
  issuer: string;
  delta: number;
};

export function parseMyBalanceChanges(
  meta: any,
  myAddress: string,
): BalanceChange[] {
  const changes: BalanceChange[] = [];

  if (!meta?.AffectedNodes) return changes;

  for (const node of meta.AffectedNodes) {
    const mod = node.ModifiedNode;
    if (!mod || mod.LedgerEntryType !== 'RippleState') continue;

    const prev = parseFloat(mod.PreviousFields?.Balance?.value ?? '0');
    const final = parseFloat(mod.FinalFields?.Balance?.value ?? '0');
    const delta = final - prev;

    if (delta === 0) continue;

    const lowAccount = mod.FinalFields.LowLimit.issuer;
    const highAccount = mod.FinalFields.HighLimit.issuer;

    if (lowAccount === myAddress || highAccount === myAddress) {
      changes.push({
        currency: mod.FinalFields.Balance.currency,
        issuer: mod.FinalFields.Balance.issuer,
        delta,
      });
    }
  }

  return changes;
}

export function parseAmmInfo(data: any) {
  const amount1 = parseFloat(data.result.amm.amount.value);
  const amount2 = parseFloat(data.result.amm.amount2.value);

  const rate1to2 = amount2 / amount1;
  const rate2to1 = amount1 / amount2;

  const asset1 = data.result.amm.amount.currency;
  const asset2 = data.result.amm.amount2.currency;

  return {
    exchangeRate: {
      [`${asset1}->${asset2}`]: rate1to2,
      [`${asset2}->${asset1}`]: rate2to1,
    },
    tradingFee: data.result.amm.trading_fee,
  };
}
