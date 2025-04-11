"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({ headless: false });
    const page = yield browser.newPage();
    // Iniciar sesión
    yield page.goto('https://www.prisa.cl/customer/user/login');
    yield page.type('#userNameSignIn', '77.235.846-6');
    yield page.type('#passwordSignIn', 'Grulla22.');
    yield page.click('#start_login');
    console.log("se inicio sesion correctamente");
    yield page.waitForNavigation();
    // Ir a la página de papelería de oficina
    yield page.goto('https://www.prisa.cl/papeleria-de-oficina');
    // Obtener los productos y precios
    const productos = yield page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-item');
        const productList = [];
        productElements.forEach(productElement => {
            var _a, _b;
            const nameElement = productElement.querySelector('.product-item__name');
            const priceElement = productElement.querySelector('.product-item__price .product-price__value');
            const name = ((_a = nameElement === null || nameElement === void 0 ? void 0 : nameElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            const price = ((_b = priceElement === null || priceElement === void 0 ? void 0 : priceElement.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
            productList.push({ name, price });
        });
        return productList;
    });
    // Imprimir los productos y precios
    console.log(productos);
    // Mantener la página abierta
    // await page.waitForTimeout(50000); // Mantener la página abierta por 50 segundos
    // await browser.close();
}))();
