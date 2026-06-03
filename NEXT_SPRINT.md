# MJ Store Next Sprint Roadmap

This roadmap is scoped to MJ Store as a digital products marketplace. It intentionally excludes physical ecommerce elements such as shipping, delivery address, and billing address.

## Critical

- Harden purchase flow for digital products
  - Add server-side validation for product orders and customer data
  - Ensure order creation is protected and only valid digital product purchases are stored
- Secure auth and roles
  - Enforce admin role on API routes and prevent unauthorized order/product actions
  - Fix any client-only admin gating by relying on server-side auth checks
- Stabilize Supabase integration
  - Remove plaintext keys from source control and confirm env management
  - Verify Supabase RBAC/RLS policies for digital product and profile access
- Improve product detail and purchase path
  - Guarantee product detail page loads correct digital product metadata
  - Ensure checkout only references digital products, not physical shipping fields

## High Priority

- Digital product sales experience
  - Add a real cart or buy-now experience for digital items
  - Show clear product delivery expectations for instant digital access
  - Add purchase confirmation and order success flow
- Customer dashboard improvements
  - Add order history and access to purchased digital product details
  - Display total spent, recent purchases, and access links
  - Add profile details and simple account management options
- Admin productivity features
  - Improve admin dashboard metrics for digital product revenue and order volume
  - Add order search/filtering by product, customer, and status
  - Add ability to update order status and manage digital product fulfillment state
- Product management
  - Add admin product create/edit/delete workflows with clean metadata input
  - Support uploading digital asset thumbnails and product descriptions
  - Add easy toggling or visibility controls for digital products

## Medium Priority

- Payments
  - Integrate a real payment provider for digital items (Stripe, PayPal, etc.)
  - Add checkout payment processing and receipt generation
  - Support successful/failed payment states in the checkout flow
- Admin productivity enhancements
  - Add admin notifications or alerts for new orders and product issues
  - Create bulk action support for order or product status updates
- Customer dashboard details
  - Add search or filter within customer orders
  - Show digital download links or purchase access points where applicable
- Product management polish
  - Add rich product metadata fields such as tags, categories, and digital format
  - Enable featured product promotion on the home page

## Low Priority

- Multi-language support
  - Consolidate translation resource usage across storefront and admin UI
  - Add language selector and persist language choice for customers
  - Localize key purchase and account flows in English, Arabic, and French
- Customer experience polish
  - Add UX feedback to checkout beyond browser alerts
  - Add better error and success notifications for account and order actions
- UX / styling refinements
  - Refine admin UI layout and data density for productivity
  - Improve storefront navigation around digital products and categories

## Notes

- Focus the next sprint on core digital product flow first: secure purchase, product management, and order visibility.
- Delay physical ecommerce concerns entirely until the marketplace supports digital delivery end-to-end.
- Use the admin dashboard and customer account screens to validate the marketplace model before investing in extensive multi-language capabilities.
