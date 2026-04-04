import type { IStockRepository } from '@/domain/repositories/IStockRepository';
import type { StockSummaryDTO } from '@/application/dtos/StockDTO';

interface CheckStockAlertsOutput {
  critical: StockSummaryDTO[];
  warning: StockSummaryDTO[];
  expiringSoon: StockSummaryDTO[];
}

export class CheckStockAlertsUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(pharmacyId: string): Promise<CheckStockAlertsOutput> {
    const summaries = await this.stockRepo.getStockSummary(pharmacyId);

    const critical = summaries.filter((s: StockSummaryDTO) => s.alertLevel === 'critical');
    const warning = summaries.filter((s: StockSummaryDTO) => s.alertLevel === 'warning');

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = summaries.filter((s: StockSummaryDTO) => {
      if (!s.nearestExpiration) return false;
      return new Date(s.nearestExpiration) <= thirtyDaysFromNow;
    });

    return { critical, warning, expiringSoon };
  }
}
