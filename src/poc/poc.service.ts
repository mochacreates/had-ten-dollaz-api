import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Firecrawl } from 'firecrawl';
import { Bot } from 'grammy';
import { PROMPT, SCHEMA, FILTERS } from './constants';

interface Filter {
  id: number;
  brand: string;
}

interface Product {
  title: string;
  price: number;
  image_url: string;
  product_url: string;
  brand: string;
  seller: string;
  notified: boolean;
}

interface FirecrawlExtractResult {
  products: Omit<Product, 'notified'>[];
}

@Injectable()
export class PocService {
  private readonly useMock = true;

  private readonly filters: Filter[] = FILTERS;
  private readonly products: Product[] = [];
  private readonly firecrawl: Firecrawl;
  private readonly firecrawlApiKey: string;
  private readonly telegramBot: Bot;
  private readonly telegramBotToken: string;
  private readonly telegramChatId: string;

  constructor(configService: ConfigService) {
    this.firecrawlApiKey =
      configService.getOrThrow<string>('FIRECRAWL_API_KEY');
    this.telegramBotToken =
      configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.telegramChatId = configService.getOrThrow<string>('TELEGRAM_CHAT_ID');

    this.firecrawl = new Firecrawl({ apiKey: this.firecrawlApiKey });
    this.telegramBot = new Bot(this.telegramBotToken);
  }

  // Orchestrator method
  async execute(): Promise<void> {
    await this.randomDelay(1_000, 2_000);

    const randomizedFilters = this.shuffleFilters(this.filters);

    for (const randomizedFilter of randomizedFilters) {
      try {
        const url = this.buildUrl(randomizedFilter.brand);

        const doc = this.useMock
          ? this.extractMock(randomizedFilter.brand)
          : await this.extract(url);

        const extractedProducts = doc?.products ?? [];

        this.saveProducts(extractedProducts);

        await this.randomDelay(3_000, 7_000);
      } catch (error) {
        console.error(
          `Error processing brand ${randomizedFilter.brand}`,
          error,
        );
      }
    }

    const unnotified = this.getUnnotifiedProducts();

    await this.notify(unnotified);

    this.markAsNotified(unnotified);
  }

  // Repository methods
  private createProduct(newProduct: Omit<Product, 'notified'>): void {
    const existingProduct = this.findProductByUrl(newProduct.product_url);

    if (existingProduct) {
      console.log(`[SKIP] ${newProduct.brand} | ${newProduct.title}`);

      return;
    }

    this.products.push({ ...newProduct, notified: false });
  }

  private saveProducts(products: Omit<Product, 'notified'>[]): void {
    products.forEach((product) => this.createProduct(product));
  }

  private findProductByUrl(url: string): Product | null {
    return this.products.find((p) => p.product_url === url) ?? null;
  }

  private getUnnotifiedProducts(): Product[] {
    return this.products.filter((p) => !p.notified);
  }

  private markAsNotified(products: Product[]): void {
    products.forEach((p) => {
      p.notified = true;
    });
  }

  // Extraction methods
  private async extract(url: string): Promise<FirecrawlExtractResult | null> {
    const doc = await this.firecrawl.scrape(url, {
      onlyMainContent: true,
      maxAge: 0,
      formats: ['markdown', { type: 'json', schema: SCHEMA, prompt: PROMPT }],
    });

    return (doc?.json as FirecrawlExtractResult) ?? null;
  }

  private extractMock(brand: string): FirecrawlExtractResult {
    const slug = this.toBrandSlug(brand);

    return {
      products: [
        {
          title: `${brand} Item A`,
          price: Math.floor(Math.random() * 200) + 50,
          image_url: `https://picsum.photos/seed/${slug}-a/400/400`,
          product_url: `https://www.enjoei.com.br/p/${slug}-mock-a`,
          brand,
          seller: `seller_${slug}_1`,
        },
        {
          title: `${brand} Item B`,
          price: Math.floor(Math.random() * 200) + 50,
          image_url: `https://picsum.photos/seed/${slug}-b/400/400`,
          product_url: `https://www.enjoei.com.br/p/${slug}-mock-b`,
          brand,
          seller: `seller_${slug}_2`,
        },
      ],
    };
  }

  // Security methods
  private shuffleFilters(filters: Filter[]): Filter[] {
    const shuffled = [...filters];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }

  // Notification methods
  private escapeMd(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
  }

  private buildMessage(products: Product[]): string {
    const timestamp = this.escapeMd(
      new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );

    const lines = products.map(
      (p, i) =>
        `${i + 1}\\. *${this.escapeMd(p.title)}* — R$ ${this.escapeMd(String(p.price))}\n   👤 ${this.escapeMd(p.seller)} · [Ver produto](${p.product_url})`,
    );

    return [
      `🔍 *Garimpagem — ${timestamp}*`,
      `✅ ${products.length} produto\\(s\\) novo\\(s\\)\n`,
      ...lines,
    ].join('\n\n');
  }

  private async notify(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    const message = this.buildMessage(products);

    await this.telegramBot.api.sendMessage(this.telegramChatId, message, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
    });
  }

  // Helpers
  private toBrandSlug(brand: string): string {
    return brand
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private buildUrl(brand: string): string {
    const brandSlug = this.toBrandSlug(brand);

    const url = new URL(`https://www.enjoei.com.br/${brandSlug}/s`);

    url.searchParams.set('ref', 'products_search');
    url.searchParams.set('q', brand);
    url.searchParams.set('lp', '24h');
    url.searchParams.set('sr', 'same_country');
    url.searchParams.set('dep', 'masculino');

    return url.toString();
  }

  // Cron method
  @Cron(CronExpression.EVERY_HOUR)
  private async handleCron(): Promise<void> {
    await this.execute();
  }
}
