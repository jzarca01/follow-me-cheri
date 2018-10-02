const Foodcheri = require('node-foodcheri');
const foodcheri = new Foodcheri({
  apiKey: config.apiKey
});
const Push = require('pushover-notifications')
const moment = require('moment')
 
const config = require('../config/config.json')

const push = new Push( {
  user: config.PUSHOVER_USER,
  token: config.PUSHOVER_TOKEN
})

const REFRESH_DELAY = 10 * 1000

let IS_SMS_SENT = false

async function followOrder(email, password) {
    try {
        await foodcheri.login(email, password)
        console.log('Logged')
        const trackingLastOrder = setInterval(async () =>  {
            const order = await foodcheri.getLastOrder()
            console.log('Order found')
            const tracking = order.tracking
            if(tracking) {
                const eta = moment(order.estimated_delivery_time_live).diff(moment(), 'minutes')
                if(tracking.smsIsSent) {
                    console.log(`Order is almost there : ETA ${eta} min`)
                    if(!IS_SMS_SENT) {
                        const msg = {
                            message: `ETA ${eta} min`,
                            title: "Order is almost there"
                        }
                        push.send(msg, function(err) {
                            if (err) {
                            throw err
                            }
                            isSmsSent = true
                        })
                    }
                }
                else {
                    console.log(`Tracking status : ${tracking.status} ETA ${eta} min`)
                }
            }
            else {
                if(order.status === 'DONE'){
                    clearInterval(trackingLastOrder)
                }
                console.log(`Order status : ${order.status}`)
            }
        }, REFRESH_DELAY)
            
    }
    catch(err) {
        console.log('error with followOrder', err)
    }
}   

module.exports = {
    followOrder: followOrder
}