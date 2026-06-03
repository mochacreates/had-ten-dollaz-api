export interface ExtractedProduct {
  title: string;
  price: number;
  brand: string;
  seller: string;
  product_url: string;
  image_url: string;
}

export interface FirecrawlExtractResult {
  products: ExtractedProduct[];
}
