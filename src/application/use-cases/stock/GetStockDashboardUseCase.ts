import type { IStockRepository } from '@/domain/repositories/IStockRepository';
import type { StockDashboardDTO, StockSummaryDTO } from '@/application/dtos/StockDTO';

export class GetStockDashboardUseCase {
  constructor(private readonly stockRepo: IStockRepository) {}

  async execute(pharmacyId: string): Promise<StockDashboardDTO> {
    const summaries = await this.stockRepo.getStockSummary(pharmacyId);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const criticalAlerts = summaries.filter((s: StockSummaryDTO) => s.alertLevel === 'critical').length;
    const warningAlerts = summaries.filter((s: StockSummaryDTO) => s.alertLevel === 'warning').length;
    const expiringThisMonth = summaries.filter((s: StockSummaryDTO) => {
      if (!s.nearestExpiration) return false;
      return new Date(s.nearestExpiration) <= endOfMonth;
    }).length;

    return {
      totalProducts: summaries.length,
      criticalAlerts,
      warningAlerts,
      expiringThisMonth,
      summaries,
    };
  }
}
