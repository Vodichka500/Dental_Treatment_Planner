export interface PriceNode {
  name: string
  price?: number // Only leaf nodes have prices
  children?: Record<string, PriceNode> // Child nodes
}

export interface PriceList {
  currency: string
  pricelist: Record<string, PriceNode> // Use recursive structure
}
