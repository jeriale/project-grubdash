const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next){
    res.json({ data: dishes });
}

function create(req, res, next) {
    const dishData = res.locals.dish;
    const newDish = {
        id: nextId(),
        ...dishData
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res, next) {
    res.status(200).json({ data: res.locals.original });
}

function update(req, res, next) {
    const updateData = res.locals.dish;
    const originalDish = res.locals.original;

    if (updateData !== originalDish) {
        const { name, description, price, image_url } = updateData;
        const updatedDish = {
            id: originalDish.id,
            name: name,
            description: description,
            price: price,
            image_url: image_url
        }
        const index = dishes.indexOf((dish) => dish.id === originalDish.id);
        dishes.splice(index, 1, updatedDish);
        res.json({ data: updatedDish });
    }
}

// Middleware Functions

function dishExists(req, res, next){
    const { dishId } = req.params;
    const found = dishes.find((dish) => dish.id === dishId);

    res.locals.dishId = dishId;
    res.locals.original = found;
    
    if (found) {
        return next();
    }

    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`
    });
}

// VALIDATE OTHER REQUEST BODIES

function validateDishName(req, res, next) {
    const { data: dishData } = req.body;
    res.locals.dish = dishData;

    if (dishData.name) {
        return next();
    }

    next({
        status: 400,
        message: 'Dish must include a name'
    });
}

function validateDishDescription(req, res, next) {
    const dishData = res.locals.dish;

    if (dishData.description) {
        return next();
    }

    next({
        status: 400,
        message: 'Dish must include a description'
    });
}

function validateDishPrice(req, res, next) {
    const dishData = res.locals.dish;

    if (dishData.price === null) {
        return next({
            status: 400,
            message: 'Dish must include a price'
        });
    } else if (dishData.price <= 0 || typeof dishData.price !== 'number') {
        return next({
            status: 400,
            message: 'Dish must have a price that is an integer greater than 0'
        });
    }

    next();
}

function validateDishImage(req, res, next) {
    const dishData = res.locals.dish;

    if (dishData.image_url) {
        return next();
    }

    next({
        status: 400,
        message: 'Dish must include a image_url'
    });
}

function validateDishIdWithRoute(req, res, next) {
    const dishData = res.locals.dish;
    const dishId = res.locals.dishId;

    if (dishId === dishData.id || !dishData.id) {
        return next();
    }

    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${dishData.id}, Route: ${dishId}`
    });
}

module.exports = {
    list,
    create: [validateDishName, validateDishDescription, validateDishPrice, validateDishImage, validateDishIdWithRoute, create],
    read: [dishExists, read],
    update: [dishExists, validateDishName, validateDishDescription, validateDishPrice, validateDishImage, validateDishIdWithRoute, update],
}
