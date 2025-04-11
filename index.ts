import puppeteer from 'puppeteer';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

async function prisaScraper() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.prisa.cl/customer/user/login');
  console.log("ingrese a la pagina")

  await page.evaluate(timeout => new Promise(resolve => setTimeout(resolve, timeout)), 1000); // Esperar 1 segundo
  await page.waitForSelector('#userNameSignIn');
  await page.evaluate(() => {
    (document.querySelector('#userNameSignIn') as HTMLInputElement).value = '77.235.846-6';
  });
  console.log("ingrese el rut")
  console.log('userNameSignIn:', await page.$eval('#userNameSignIn', (el: any) => el.value));
  await page.waitForSelector('#passwordSignIn');
  await page.evaluate(() => {
    (document.querySelector('#passwordSignIn') as HTMLInputElement).value = 'Grulla22.';
  });
  console.log("ingrese el password")
  console.log('passwordSignIn:', await page.$eval('#passwordSignIn', (el: any) => el.value));

  // Guardar el HTML de la página
  //const html = await page.content();
  //require('fs').writeFileSync('page.html', html);

  await page.evaluate(() => {
    (document.querySelector('#start_login') as HTMLElement)!.click();
  });

  await page.waitForNavigation({ timeout: 5000 });

  // Navegar a la página "Papelería de Oficina"
  await page.goto('https://www.prisa.cl/papeleria-de-oficina');
  console.log('Navegando a Papelería de Oficina');

  // Imprimir la URL actual
  console.log('URL actual:', page.url());

  // Extract user information from dataLayer
  const dataLayerInfo = await page.evaluate(() => {
    return window.dataLayer.find(item => item.customerUserId)?.customerUserId;
  });

  console.log('User ID:', dataLayerInfo);

  // Get the HTML of the page
  const html = await page.content();
  console.log(html);

  // Cerrar el navegador
  await browser.close();
}

prisaScraper();
