const Foodcheri = require('node-foodcheri');
const config = require('../config/config.json')
const foodcheri = new Foodcheri({
  apiKey: config.apiKey
});
const Push = require( 'pushover-notifications' )
 
const push = new Push( {
  user: config.PUSHOVER_USER,
  token: config.PUSHOVER_TOKEN
})

const REFRESH_DELAY = 10 * 1000

let isSmsSent = false

async function followOrder(email, password) {
    try {
        await foodcheri.login(email, password)
        console.log('Logged')
        const trackingLastOrder = setInterval(async () =>  {
            const order = await foodcheri.getLastOrder()
            console.log('Order found')
            const tracking = order.tracking
            if(tracking) {
                if(tracking.smsIsSent) {
                    console.log(`Order is almost there: ETA ${tracking.eta} min`)
                    if(!isSmsSent) {
                        const msg = {
                            message: `ETA ${tracking.eta} min`,
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
                    console.log(`Tracking status : ${tracking.trackingStatus} ETA ${tracking.eta} min`)
                }
            }
            else {
                if(order.status === 'COMPLETED'){
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