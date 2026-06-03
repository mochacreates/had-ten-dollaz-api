export const PROMPT = `Extract data according to the provided schema.

Use only information explicitly present on the page.
Do not infer, estimate, or hallucinate values.
Return null when data is unavailable.
Prioritize structured data over rendered text.
Ignore ads, recommendations, sponsored content, and duplicate content.
Extract only data related to the target listing(s).`;

export const SCHEMA = {
  type: 'object',
  required: ['products'],
  properties: {
    products: {
      type: 'array',
      items: {
        type: 'object',
        required: [],
        properties: {
          title: {
            type: 'string',
          },
          price: {
            type: 'number',
          },
          image_url: {
            type: 'string',
          },
          product_url: {
            type: 'string',
          },
          brand: {
            type: 'string',
          },
          seller: {
            type: 'string',
          },
        },
      },
    },
  },
};
