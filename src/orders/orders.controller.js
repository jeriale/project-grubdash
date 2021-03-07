const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
    res.json({ data: orders });
}

function create(req, res, next) {
    const orderData = res.locals.order;
    const newOrder = {
        id: nextId(),
        ...orderData
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
    res.json({ data: res.locals.original });
}

function update(req, res, next) {
    const updateData = res.locals.order;
    const originalOrder = res.locals.original;

    if (updateData !== originalOrder) {
        const { deliverTo, mobileNumber, status, dishes } = updateData;
        const updatedOrder = {
            id: originalOrder.id,
            deliverTo: deliverTo,
            mobileNumber: mobileNumber,
            status: status,
            dishes: dishes
        }
        const index = orders.indexOf((order) => order.id === originalOrder.id);
        orders.splice(index, 1, updatedOrder);
        res.json({ data: updatedOrder });
    }
}

function destroy(req, res, next) {
    const orderData = res.locals.original;
    const orderId = res.locals.orderId;

    if (orderData.status === 'pending') {
        const index = orders.indexOf((order) => order.id === orderId);
        const deleted = orders.slice(index, 1);
        res.status(204).json({ data: deleted });
    }

    next({
        status: 400,
        message: 'An order cannot be deleted unless it is pending'
    });
}

// Middleware Functions

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const found = orders.find((order) => order.id === orderId);

    res.locals.orderId = orderId;
    res.locals.original = found;

    if (found) {
       return next();
    }

    next({
        status: 404,
        message: `${orderId}`
    });
}

function validateDeliverTo(req, res, next) {
    const { data: orderData } = req.body;
    res.locals.order = orderData;

    if (orderData.deliverTo) {
        return next();
    }

    next({
        status: 400,
        message: 'Order must include deliverTo'
    });
}

function validateMobileNumber(req, res, next) {
    const orderData = res.locals.order;

    if (orderData.mobileNumber) {
        return next();
    }

    next({
        status: 400,
        message: 'Order must include mobileNumber'
    });
}

function validateDishes(req, res, next) {
    const orderData = res.locals.order;

    if (!orderData.dishes) {
        return next({
            status: 400,
            message: 'Order must include a dish'
        });
    } else if (!orderData.dishes.length || !Array.isArray(orderData.dishes)) {
        return next({
            status: 400,
            message: 'Order must include at least one dish'
        });
    }

    next();
}

function validateQuantity(req, res, next) {
    const orderData = res.locals.order;
    const index = orderData.dishes.findIndex((dish) => !dish.quantity || !Number.isInteger(dish.quantity));

    if (index === -1) {
        return next();
    }

    next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`
    });
}

function validateOrderIdWithRoute(req, res, next) {
    const orderData = res.locals.order;
    const orderId = res.locals.orderId;

    if (orderData.id === orderId || !orderData.id) {
        return next();
    }

    next({
        status: 400,
        message: `Order id does not match route id. Order: ${orderData.id}, Route: ${orderId}.`
    });
}

function validateStatusProperty(req, res, next) {
    const orderData = res.locals.order;

    if (!orderData.status || orderData.status === "invalid") {
        return next({
            status: 400,
            message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
        });
    } else if (orderData.status === "delivered") {
        return next({
            status: 400,
            message: 'A delivered order cannot be changed'
        });
    }

    next();
}

module.exports = {
    list,
    create: [validateDeliverTo, validateMobileNumber, validateDishes, validateQuantity, create],
    read: [orderExists, read],
    update: [orderExists, validateDeliverTo, validateMobileNumber, validateDishes, validateQuantity, validateOrderIdWithRoute, validateStatusProperty, update],
    delete: [orderExists, destroy]
}