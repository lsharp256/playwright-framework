import { Locator, Page } from '@playwright/test';
import { BasePage } from './base/BasePage.js';
import { NavbarComponent } from './components/NavbarComponent.js';

export class DashboardPage extends BasePage {
  readonly navbar: NavbarComponent;

  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productItems: Locator;
  readonly featureItemsHeader: Locator;
  readonly categoryList: Locator;

  constructor(page: Page) {
    super(page, '/');
    this.navbar = new NavbarComponent(page);

    this.searchInput = page.locator('#search_product, input[name="search"]').first();
    this.searchButton = page.locator('#submit_search, button:has-text("Search")').first();
    this.productItems = page.locator('.features_items .col-sm-4, .product-image-wrapper');
    this.featureItemsHeader = page.locator('.features_items h2.title');
    this.categoryList = page.locator('.category-products .panel');
  }

  async searchProduct(keyword: string): Promise<void> {
    await this.logger.step(`Search for product: ${keyword}`, async () => {
      if (!(await this.searchInput.isVisible())) {
        await this.navigate('/products');
      }
      await this.fill(this.searchInput, keyword, 'Search Input');
      await this.click(this.searchButton, 'Search Submit Button');
    });
  }

  async getProductCount(): Promise<number> {
    return await this.productItems.count();
  }

  async getFirstProductTitle(): Promise<string> {
    return (await this.productItems.first().locator('p').first().innerText()).trim();
  }

  async addFirstProductToCart(): Promise<void> {
    await this.logger.step('Add first product to cart', async () => {
      const addBtn = this.productItems
        .first()
        .locator('.add-to-cart, a:has-text("Add to cart")')
        .first();
      await this.click(addBtn, 'Add to Cart Button');
    });
  }
}
