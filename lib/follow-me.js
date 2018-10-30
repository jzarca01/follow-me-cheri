const Foodcheri = require('node-foodcheri');
const config = require('../config/config.json');

const foodcheri = new Foodcheri({
  apiKey: config.apiKey
});

const faker = require('faker')
const coupons = require('./coupons')

const Push = require('pushover-notifications');
const moment = require('moment');

const push = new Push({
  user: config.PUSHOVER_USER,
  token: config.PUSHOVER_TOKEN
});

const REFRESH_DELAY = 10 * 1000;

let IS_SMS_SENT = false;

async function followOrder(email, password) {
  try {
    await foodcheri.login(email, password);
    console.log('Logged');
    const trackLastOrder = setInterval(async () => {
      const order = await foodcheri.getLastOrder();
      console.log('Order found');
      const eta = moment(order.estimated_delivery_time_live).diff(
        moment(),
        'minutes'
      );
      if (order.tracking) {
        const tracking = order.tracking;
        if (eta <= 5) {
          console.log(`Order is almost there : ETA ${eta} min`);
          if (!IS_SMS_SENT) {
            const msg = {
              title: 'Order is almost there',
              message: `ETA ${eta} min https://www.foodcheri.com/tracking-order/${order.hash}`
            };
            push.send(msg, function (err) {
              if (err) {
                throw err;
              }
              IS_SMS_SENT = true;
            });
          }
        } else {
          console.log(
            `Tracking status : ${JSON.stringify(tracking)} ETA ${eta} min`
          );
        }
      } else {
        if (
          order.status === 'DONE' ||
          order.status === 'UNDELIVERED_FOODCHERI'
        ) {
          clearInterval(trackLastOrder);
        }
        console.log(`Order status : ${order.status} ETA ${eta} min`);
      }
    }, REFRESH_DELAY);
  } catch (err) {
    console.log('error with followOrder', err);
  }
}

async function createAccount(password, name) {
  try {
    const user = {
      first_name: name.split(' ')[0],
      last_name: name.split(' ')[1],
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.phoneNumber('0624######'),
      password: password
    }
    const account = await foodcheri.signUp(user)
    return {
      ...user,
      ...account,
      voucher: coupons[Math.floor(Math.random() * coupons.length)]
    }
  } catch (err) {
    console.log('error with createAccount', err);
  }
}

module.exports = {
  followOrder,
  createAccount
};