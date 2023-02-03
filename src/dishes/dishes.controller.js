const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// Validate if dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

// Validate body data exists (name, description, price, image_url)
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

// Validate properties (name, description, price, image_url)
function namePropertyIsValid(req, res, next) {
  const {
    data: { name },
  } = req.body;
  if (name.length === 0) {
    return next({
      status: 400,
      message: `Dish must include a name`,
    });
  }
  next();
}

function descriptionPropertyIsValid(req, res, next) {
  const {
    data: { description },
  } = req.body;
  if (description.length === 0) {
    return next({
      status: 400,
      message: `Dish must include a description`,
    });
  }
  next();
}

function pricePropertyIsValid(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

function imageUrlPropertyIsValid(req, res, next) {
  const {
    data: { image_url },
  } = req.body;
  if (image_url.length === 0) {
    return next({
      status: 400,
      message: `Dish must include a image_url`,
    });
  }
  next();
}

// Validate dish id matches route id
function validateDishBodyId(req, res, next) {
  const { dishId } = req.params;
  const {
    data: { id },
  } = req.body;

  if (!id || dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// Routes
// GET /
function list(req, res) {
  res.json({ data: dishes });
}

// GET /:dishId
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// POST /
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// PUT /:dishId
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    create,
  ],
  update: [
    dishExists,
    bodyDataHas('name'),
    bodyDataHas('description'),
    bodyDataHas('price'),
    bodyDataHas('image_url'),
    namePropertyIsValid,
    descriptionPropertyIsValid,
    pricePropertyIsValid,
    imageUrlPropertyIsValid,
    validateDishBodyId,
    update,
  ],
};
