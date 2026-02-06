import { AppError } from '../common/app-error.js';
import { env } from '../config/env.js';
import { RagBackfillRepository } from '../repositories/rag-backfill.repository.js';
import { RagRepository, type RagEntityType } from '../repositories/rag.repository.js';
import {
  RagBackfillService,
  defaultRagBackfillInput,
  type RagBackfillInput,
  type RagReprocessInput,
} from '../services/rag-backfill.service.js';
import { RagSyncService } from '../services/rag-sync.service.js';

type RagBackfillCliOptions = {
  entityTypes: RagEntityType[];
  fromDate?: string;
  toDate?: string;
  entityId?: string;
  dryRun: boolean;
  batchSize: number;
  maxItemAttempts: number;
  failureAlertThreshold: number;
  reprocessFailures: boolean;
  includePermanent: boolean;
  failureLimit?: number;
  showHelp: boolean;
};

// Parses command line arguments into structured options.
const parseArgs = (argv: string[]): RagBackfillCliOptions => {
  const defaults = defaultRagBackfillInput();
  const options: RagBackfillCliOptions = {
    entityTypes: defaults.entityTypes,
    dryRun: false,
    batchSize: defaults.batchSize,
    maxItemAttempts: defaults.maxItemAttempts,
    failureAlertThreshold: defaults.failureAlertThreshold,
    reprocessFailures: false,
    includePermanent: false,
    showHelp: false,
  };

  const map = new Map<string, string | boolean>();
  let currentKey: string | null = null;

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      currentKey = arg;
      map.set(arg, true);
      continue;
    }

    if (currentKey) {
      map.set(currentKey, arg);
      currentKey = null;
    }
  }

  if (map.has('--help')) {
    options.showHelp = true;
  }

  if (map.has('--dry-run')) {
    options.dryRun = true;
  }

  if (map.has('--reprocess-failures')) {
    options.reprocessFailures = true;
  }

  if (map.has('--include-permanent')) {
    options.includePermanent = true;
  }

  if (typeof map.get('--entity-type') === 'string') {
    options.entityTypes = parseEntityTypes(String(map.get('--entity-type')));
  }

  if (typeof map.get('--from') === 'string') {
    options.fromDate = validateIsoDate(String(map.get('--from')), 'Data inicial inválida.');
  }

  if (typeof map.get('--to') === 'string') {
    options.toDate = validateIsoDate(String(map.get('--to')), 'Data final inválida.');
  }

  if (typeof map.get('--entity-id') === 'string') {
    options.entityId = String(map.get('--entity-id'));
  }

  const batchSizeVal = map.get('--batch-size');
  if (typeof batchSizeVal === 'string') {
    options.batchSize = normalizeNumber(batchSizeVal, defaults.batchSize, 'Batch size inválido.');
  }

  const maxAttemptsVal = map.get('--max-attempts');
  if (typeof maxAttemptsVal === 'string') {
    options.maxItemAttempts = normalizeNumber(
      maxAttemptsVal,
      defaults.maxItemAttempts,
      'Número máximo de tentativas inválido.',
    );
  }

  const failureThresholdVal = map.get('--failure-threshold');
  if (typeof failureThresholdVal === 'string') {
    options.failureAlertThreshold = normalizeFloat(
      failureThresholdVal,
      defaults.failureAlertThreshold,
      'Limite de falhas inválido.',
    );
  }

  const failureLimitVal = map.get('--failure-limit');
  if (typeof failureLimitVal === 'string') {
    options.failureLimit = normalizeNumber(failureLimitVal, 200, 'Limite de falhas inválido.');
  }

  return options;
};

// Parses and validates entity type input from CLI flags.
const parseEntityTypes = (value: string): RagEntityType[] => {
  const normalized = value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
  const allowed: RagEntityType[] = ['product', 'customer', 'manager', 'order', 'order_item'];
  const selected = normalized.filter((item) => allowed.includes(item as RagEntityType)) as RagEntityType[];

  if (selected.length === 0) {
    throw new AppError(400, 'Informe pelo menos um entity_type válido.');
  }

  return selected;
};

// Ensures the string is a valid ISO date and returns it.
const validateIsoDate = (value: string, errorMessage: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new AppError(400, errorMessage);
  }

  return new Date(parsed).toISOString();
};

// Normalizes an integer CLI value with a default fallback.
const normalizeNumber = (
  value: string | undefined,
  fallback: number,
  errorMessage: string,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(400, errorMessage);
  }

  return Math.trunc(parsed);
};

// Normalizes a float CLI value with a default fallback.
const normalizeFloat = (
  value: string | undefined,
  fallback: number,
  errorMessage: string,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, errorMessage);
  }

  return parsed;
};

// Logs a help menu with available CLI parameters in pt-BR.
const printHelp = (): void => {
  console.info(`Uso:
  npm run rag:backfill -- [opções]

Opções:
  --entity-type <tipos>       Tipos separados por vírgula (product,customer,manager,order,order_item)
  --entity-id <uuid>          Reindexar uma única entidade (requer entity-type único)
  --from <data ISO>           Data inicial (ex: 2024-01-01T00:00:00Z)
  --to <data ISO>             Data final (ex: 2024-01-31T23:59:59Z)
  --batch-size <número>       Tamanho do lote (padrão: ${env.ragBackfillBatchSize})
  --max-attempts <número>     Tentativas por item (padrão: ${env.ragBackfillMaxAttempts})
  --failure-threshold <n>     Limite de alerta de falhas (padrão: ${env.ragBackfillFailureAlertThreshold})
  --dry-run                   Apenas estimar volume sem gravar
  --reprocess-failures        Reprocessar falhas registradas
  --include-permanent         Inclui falhas permanentes no reprocessamento
  --failure-limit <número>    Limite de falhas por execução (padrão: 200)
  --help                      Exibir ajuda
`);
};

// Runs the backfill CLI with robust error handling.
const run = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  if (options.showHelp) {
    printHelp();
    return;
  }

  if (options.entityId && options.entityTypes.length !== 1) {
    throw new AppError(400, 'Informe apenas um entity_type ao usar entity-id.');
  }

  const ragRepository = new RagRepository();
  const ragBackfillRepository = new RagBackfillRepository();
  const ragSyncService = new RagSyncService(ragRepository);
  const ragBackfillService = new RagBackfillService(ragRepository, ragBackfillRepository, ragSyncService);

  if (options.reprocessFailures) {
    const reprocessInput: RagReprocessInput = {
      entityType: options.entityTypes.length === 1 ? options.entityTypes[0] : undefined,
      includePermanent: options.includePermanent,
      limit: options.failureLimit,
      maxItemAttempts: options.maxItemAttempts,
    };

    const report = await ragBackfillService.reprocessFailures(reprocessInput);
    console.info(
      JSON.stringify({
        evento: 'rag_backfill_reprocessamento',
        mensagem: 'Reprocessamento de falhas concluído.',
        total: report.total,
        sucesso: report.success,
        falhas: report.failures,
      }),
    );
    return;
  }

  const backfillInput: RagBackfillInput = {
    entityTypes: options.entityTypes,
    fromDate: options.fromDate,
    toDate: options.toDate,
    entityId: options.entityId,
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    maxItemAttempts: options.maxItemAttempts,
    failureAlertThreshold: options.failureAlertThreshold,
  };

  const report = await ragBackfillService.runBackfill(backfillInput);
  console.info(
    JSON.stringify({
      evento: 'rag_backfill',
      mensagem: report.dryRun
        ? 'Simulação concluída com sucesso.'
        : 'Backfill concluído com sucesso.',
      total: report.total,
      sucesso: report.success,
      falhas: report.failures,
      duracaoMs: report.elapsedMs,
      detalhes: report.perEntity,
    }),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof AppError ? error.mensagem : 'Erro inesperado ao executar o backfill.';
  console.error(JSON.stringify({ evento: 'rag_backfill_erro', mensagem: message }));
  process.exitCode = 1;
});
