const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// Validate if order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `order id not found: ${orderId}`,
  });
}

// Validate body data exists (deliverTo, mobileNumber, status, dishes)
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

// Validate properties (deliverTo, mobileNumber, dishes,  dish quantity, status)
function deliverToPropertyIsValid(req, res, next) {
  const {
    data: { deliverTo },
  } = req.body;
  if (deliverTo.length === 0) {
    return next({
      status: 400,
      message: `Order must include a deliverTo`,
    });
  }
  next();
}

function mobileNumberPropertyIsValid(req, res, next) {
  const {
    data: { mobileNumber },
  } = req.body;
  if (mobileNumber.length === 0) {
    return next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }
  next();
}

function dishesPropertyIsValid(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  if (Array.isArray(dishes) && dishes.length !== 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include at least one dish`,
  });
}

function dishQuantityPropertyIsValid(req, res, next) {
  const {
    data: { dishes },
  } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    const quantity = dishes[i].quantity;
    if (!quantity || !Number.isInteger(quantity)) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  return next();
}

function statusPropertyIsValid(req, res, next) {
  const {
    data: { status },
  } = req.body;
  const validStatus = ['pending', 'preparing', 'out-for-delivery'];
  if (validStatus.includes(status)) {
    return next();
  } else if (status === 'delivered') {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

// Validate order id matches route id
function validateOrderBodyId(req, res, next) {
  const { orderId } = req.params;
  const {
    data: { id },
  } = req.body;

  if (!id || orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

// Validate if order status is 'pending' to delete
function deleteMethodIsValid(req, res, next) {
  const order = res.locals.order;
  if (order.status === 'pending') {
    return next();
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

// Routes
// GET /
function list(req, res) {
  res.json({ data: orders });
}

// GET /:orderId
function read(req, res) {
  res.json({ data: res.locals.order });
}

// POST /
function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// PUT /:orderId
function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// DELETE /:orderId
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  return res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    bodyDataHas('dishes'),
    deliverToPropertyIsValid,
    mobileNumberPropertyIsValid,
    dishesPropertyIsValid,
    dishQuantityPropertyIsValid,
    create,
  ],
  update: [
    orderExists,
    bodyDataHas('deliverTo'),
    bodyDataHas('mobileNumber'),
    bodyDataHas('status'),
    bodyDataHas('dishes'),
    deliverToPropertyIsValid,
    mobileNumberPropertyIsValid,
    dishesPropertyIsValid,
    dishQuantityPropertyIsValid,
    statusPropertyIsValid,
    validateOrderBodyId,
    update,
  ],
  delete: [orderExists, deleteMethodIsValid, destroy],
  orderExists,
};
