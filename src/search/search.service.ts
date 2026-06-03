import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Firecrawl from 'firecrawl';
import { FirecrawlExtractResult } from './interfaces/firecrawl-extract.result.interface';
import { Bot } from 'grammy';
import { FilterService } from '../filter/filter.service';
import { ProductService } from '../product/product.service';
import { Filter } from '../filter/entities/filter.entity';
import { Product } from '../product/entities/product.entity';
import { SCHEMA, PROMPT } from './constants';

@Injectable()
export class SearchService {
  private readonly useExtractMock = true;
  private readonly useNotifyMock = true;

  private readonly firecrawl: Firecrawl;
  private readonly telegramBot: Bot;

  private readonly firecrawlApiKey: string;
  private readonly telegramBotToken: string;
  private readonly telegramChatId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly filterService: FilterService,
    private readonly productService: ProductService,
  ) {
    this.firecrawlApiKey = this.configService.getOrThrow('FIRECRAWL_API_KEY');

    this.telegramBotToken = this.configService.getOrThrow('TELEGRAM_BOT_TOKEN');

    this.telegramChatId = this.configService.getOrThrow('TELEGRAM_CHAT_ID');

    this.firecrawl = new Firecrawl({
      apiKey: this.firecrawlApiKey,
    });

    this.telegramBot = new Bot(this.telegramBotToken);
  }

  // Orchestrator method
  async execute(): Promise<void> {
    await this.randomDelay(1_000, 2_000);

    const filters = await this.filterService.findAll();

    const randomizedFilters = this.shuffleFilters(filters);

    for (const randomizedFilter of randomizedFilters) {
      try {
        const url = this.buildUrl(randomizedFilter);

        const doc = this.useExtractMock
          ? this.extractMock(randomizedFilter.brand)
          : await this.extract(url);

        const extractedProducts = doc?.products ?? [];

        for (const product of extractedProducts) {
          const existing = await this.productService.findByUrl(
            product.product_url,
          );

          if (!existing) {
            await this.productService.create({ ...product, notified: false });
          }
        }

        await this.randomDelay(3_000, 7_000);
      } catch (error) {
        console.error(
          `Error processing brand ${randomizedFilter.brand}`,
          error,
        );
      }
    }

    const unnotified = await this.productService.getUnnotifiedProducts();

    await this.notify(unnotified);

    for (const product of unnotified) {
      await this.productService.markAsNotified(product.id);
    }
  }

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
          product_url: `https://www.example.com/p/${slug}-mock-a`,
          brand,
          seller: `seller_${slug}_1`,
        },
        {
          title: `${brand} Item B`,
          price: Math.floor(Math.random() * 200) + 50,
          image_url: `https://picsum.photos/seed/${slug}-b/400/400`,
          product_url: `https://www.example.com/p/${slug}-mock-b`,
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

    if (this.useNotifyMock) {
      this.notifyMock(message);
      return;
    }

    await this.telegramBot.api.sendMessage(this.telegramChatId, message, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
    });
  }

  private notifyMock(message: string): void {
    console.log('[NOTIFY MOCK] Mensagem que seria enviada ao Telegram:');
    console.log(message);
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

  private buildUrl(filter: Filter): string {
    const brandSlug = this.toBrandSlug(filter.brand);

    const url = new URL(`https://www.enjoei.com.br/${brandSlug}/s`);

    url.searchParams.set('ref', 'products_search');
    url.searchParams.set('q', filter.brand);
    url.searchParams.set('lp', '24h');
    url.searchParams.set('sr', 'same_country');
    url.searchParams.set('dep', 'masculino');

    return url.toString();
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async handleCron(): Promise<void> {
    await this.execute();
  }
}
