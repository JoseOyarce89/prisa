import puppeteer, { Page } from "puppeteer";
import fs from "fs"; // Importar el módulo fs para escribir archivos
import * as XLSX from "xlsx"; // Importar la librería xlsx

// Actualizamos la interfaz para incluir explícitamente precio e imagen (opcionales)
interface ProductData {
  id?: string;
  name?: string;
  brand?: string;
  category?: string;
  price?: string | number; // Puede ser string o número
  imageUrl?: string;
  [key: string]: any; // Permite otras propiedades del JSON
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Iniciar sesión
  await page.goto("https://www.prisa.cl/customer/user/login");
  await page.type("#userNameSignIn", "77.235.846-6");
  await page.type("#passwordSignIn", "Grulla22.");
  await page.click("#start_login");

  await page.waitForNavigation();
  console.log("se inicio sesion correctamente");
  // Ir a la página de papelería de oficina
  await page.goto("https://www.prisa.cl/papeleria-de-oficina");
  await page.waitForSelector(".product-item");
  console.log("se cargo la pagina de papeleria de oficina");
  const productos: ProductData[] = await page.evaluate(() => {
    const productElements = document.querySelectorAll(".product-item");
    console.log("productElements count:", productElements.length); // Loguear cantidad
    const productList: ProductData[] = [];

    productElements.forEach((productElement) => {
      // Buscar el div hijo con el atributo data-gtm-model
      const gtmElement = productElement.querySelector<HTMLElement>(
        "div[data-gtm-model]" // Selector más específico basado en la imagen
      );

      let productData: ProductData = {}; // Inicializar objeto vacío

      // 1. Extraer datos del JSON (data-gtm-model)
      if (gtmElement && gtmElement.dataset.gtmModel) {
        try {
          productData = JSON.parse(gtmElement.dataset.gtmModel);
        } catch (error) {
          console.error(
            "Error parsing JSON:",
            error,
            gtmElement.dataset.gtmModel
          );
          // Opcional: agregar un objeto vacío o con error si falla el parseo
          productList.push({
            error: "Failed to parse JSON",
            rawData: gtmElement.dataset.gtmModel,
          });
        }
      } else {
        console.warn(
          "Elemento data-gtm-model no encontrado en:",
          productElement
        );
        productData.error = "data-gtm-model not found";
      }

      // 2. Extraer URL de la imagen del HTML
      const imageElement = productElement.querySelector<HTMLImageElement>(
        ".product-item__preview img"
      );
      if (imageElement && imageElement.src) {
        // Asegurarse de que la URL sea absoluta
        try {
          productData.imageUrl = new URL(
            imageElement.src,
            document.baseURI
          ).toString();
        } catch (e) {
          console.warn(
            "Error creando URL absoluta para imagen:",
            imageElement.src,
            e
          );
          productData.imageUrl = imageElement.src; // Usar relativa si falla
        }
      } else {
        console.warn("Elemento de imagen no encontrado en:", productElement);
        productData.imageUrl = ""; // O asignar un valor por defecto
      }

      // 3. Extraer precio (priorizar JSON, luego HTML)
      // Asegurarse de que el precio del JSON sea tratado como string para la verificación
      const priceFromJson = productData.price
        ? String(productData.price).trim()
        : "";

      if (!priceFromJson) {
        // Si no vino en el JSON o es vacío/cero/null/undefined
        const priceElement = productElement.querySelector<HTMLElement>(
          '.product-price__value[itemprop="offers"] span[itemprop="formattedPrice"]'
        );
        if (priceElement && priceElement.textContent) {
          // Limpiar el precio (quitar $, puntos de miles, + IVA, etc.)
          const priceText = priceElement.textContent.trim();
          // Regex mejorado para extraer solo números
          const priceMatch = priceText.match(/[\d.,]+/); // Encuentra la primera secuencia de dígitos, puntos o comas
          if (priceMatch) {
            // Quita puntos de miles y reemplaza coma decimal si existe
            productData.price = priceMatch[0]
              .replace(/\./g, "")
              .replace(",", ".")
              .trim();
          } else {
            productData.price = ""; // O manejar como error si no se extrae número
            console.warn(
              "No se pudo extraer un número del precio HTML:",
              priceText
            );
          }
        } else {
          console.warn(
            "Elemento de precio HTML no encontrado en:",
            productElement
          );
          // Dejar productData.price como undefined o asignar un valor por defecto si es necesario
          if (!productData.price) productData.price = ""; // Asegurar que exista la propiedad si no se encontró nada
        }
      } else {
        // Si el precio vino del JSON, asegurarse que sea un string limpio (solo números/decimal)
        productData.price = String(productData.price).replace(/[^\d.]/g, ""); // Quitar cualquier cosa que no sea dígito o punto
      }

      // 4. Agregar el objeto combinado a la lista (solo si no hubo error antes)
      if (!productData.error) {
        productList.push(productData);
      }
      // Nota: Los errores ya se agregaron a productList dentro de los bloques try/catch y else
    });

    return productList;
  });

  // Imprimir los productos (ahora con imagen y precio)
  console.log(JSON.stringify(productos, null, 2)); // Usar JSON.stringify para mejor visualización

  // Mantener la página abierta (opcional, descomentar si es necesario)
  // Imprimir los productos (ahora con imagen y precio)
  console.log(JSON.stringify(productos, null, 2)); // Usar JSON.stringify para mejor visualización

  // --- Guardar datos en archivos ---
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-"); // Crear timestamp para nombres de archivo únicos
  const jsonFilePath = `productos-${timestamp}.json`;
  const excelFilePath = `productos-${timestamp}.xlsx`;

  // 1. Guardar en archivo JSON
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(productos, null, 2), "utf-8");
    console.log(`Datos guardados exitosamente en ${jsonFilePath}`);
  } catch (error) {
    console.error(`Error al guardar el archivo JSON: ${error}`);
  }

  // 2. Guardar en archivo Excel (XLSX)
  try {
    // Crear una nueva hoja de cálculo a partir del array de objetos
    const worksheet = XLSX.utils.json_to_sheet(productos);
    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();
    // Añadir la hoja de cálculo al libro de trabajo
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos"); // Nombrar la hoja como "Productos"

    // Escribir el libro de trabajo en un archivo XLSX
    XLSX.writeFile(workbook, excelFilePath);
    console.log(`Datos guardados exitosamente en ${excelFilePath}`);
  } catch (error) {
    console.error(`Error al guardar el archivo Excel: ${error}`);
  }
  // --- Fin de guardar datos ---

  // Mantener la página abierta (opcional, descomentar si es necesario)
  // await new Promise(resolve => setTimeout(resolve, 50000));

  await browser.close(); // Cerrar el navegador al final
})();
