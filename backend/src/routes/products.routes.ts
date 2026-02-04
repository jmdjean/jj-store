import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.js';
import { ProductsService } from '../services/products.service.js';
import { ProductsRepository } from '../repositories/products.repository.js';

const productsRepository = new ProductsRepository();
const productsService = new ProductsService(productsRepository);
const productsController = new ProductsController(productsService);

export const productsRouter = Router();

productsRouter.get('/products', (request, response, next) => {
  productsController.listProducts(request, response, next);
});

productsRouter.get('/products/:id', (request, response, next) => {
  productsController.getProductById(request, response, next);
});
