import puppeteer, { Page } from 'puppeteer';

interface Product {
  name: string;
  price: string;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Iniciar sesión
  await page.goto('https://www.prisa.cl/customer/user/login');
  await page.type('#userNameSignIn', '77.235.846-6');
  await page.type('#passwordSignIn', 'Grulla22.');
  await page.click('#start_login');
  console.log("se inicio sesion correctamente")
  await page.waitForNavigation();

  // Ir a la página de papelería de oficina
  await page.goto('https://www.prisa.cl/papeleria-de-oficina');

  // Obtener los productos y precios
  const productos: Product[] = await page.evaluate(() => {
    const productElements = document.querySelectorAll('.product-item');
    const productList: Product[] = [];

    productElements.forEach(productElement => {
      const nameElement = productElement.querySelector('.product-item__name');
      const priceElement = productElement.querySelector('.product-item__price .product-price__value');

      const name = nameElement?.textContent?.trim() || '';
      const price = priceElement?.textContent?.trim() || '';

      productList.push({ name, price });
    });

    return productList;
  });

  // Imprimir los productos y precios
  console.log(productos);

  // Mantener la página abierta
  // await page.waitForTimeout(50000); // Mantener la página abierta por 50 segundos
  // await browser.close();
})();
