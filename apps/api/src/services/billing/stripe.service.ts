import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  async getCustomerSubscription(customerId: string) {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });
    return subscriptions.data[0];
  }

  /**
   * Gating logic based on subscription tiers.
   */
  async checkAccess(customerId: string, requiredTier: 'PRO' | 'INSTITUTIONAL') {
    const subscription = await this.getCustomerSubscription(customerId);
    if (!subscription) return false;

    // Logic to map priceId to Tier
    return true; // Simplified for Phase 4
  }
}
