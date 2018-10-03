const Foodcheri = require('node-foodcheri');
const config = require('../config/config.json')

const foodcheri = new Foodcheri({
    apiKey: config.apiKey
});
const Push = require('pushover-notifications')
const moment = require('moment')


const push = new Push({
    user: config.PUSHOVER_USER,
    token: config.PUSHOVER_TOKEN
})

const REFRESH_DELAY = 10 * 1000

let IS_SMS_SENT = false

async function followOrder(email, password) {
    try {
        await foodcheri.login(email, password)
        console.log('Logged')
        const order = await foodcheri.getLastOrder()
        console.log('Order found')
        const trackLastOrder = setInterval(async () => {
            const tracking = order.tracking
            const eta = moment(order.estimated_delivery_time_live).diff(moment(), 'minutes')
            if (tracking) {
                if (eta <= 5) {
                    console.log(`Order is almost there : ETA ${eta} min`)
                    if (!IS_SMS_SENT) {
                        const msg = {
                            title: "Order is almost there",
                            message: `ETA ${eta} min`
                        }
                        push.send(msg, function (err) {
                            if (err) {
                                throw err
                            }
                            IS_SMS_SENT = true
                        })
                    }
                } else {
                    console.log(`Tracking status : ${JSON.stringify(tracking)} ETA ${eta} min`)
                }
            } else {
                if (order.status === 'DONE') {
                    clearInterval(trackLastOrder)
                }
                console.log(`Order status : ${order.status} ETA ${eta} min`)
            }
        }, REFRESH_DELAY, order)

    } catch (err) {
        console.log('error with followOrder', err)
    }
}

module.exports = {
    followOrder: followOrder
}