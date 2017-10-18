// Be sure to add these ENV variables!
const {
  MOONCLERK_API_KEY,
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID,
  KEYGEN_POLICY_ID,
  PORT = 8080
} = process.env

const fetch = require('node-fetch')
const crypto = require('crypto')
const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const app = express()

app.use(bodyParser.json({ type: 'application/vnd.moonclerk+json' }))
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(morgan('combined'))

app.set('view engine', 'ejs')

// 1. Our MoonClerk checkout form will redirect here after a successful purchase. Inside
//    this route, we'll verify that the passed customer/payment is valid within MoonClerk
//    and then create a Keygen license resource. After that has successfully been done,
//    we'll render a 'success' page containing our user's license key which they can
//    use inside of our software product, e.g.:
//
//    curl -X POST https://api.keygen.sh/v1/accounts/$KEYGEN_ACCOUNT_ID/licenses/actions/validate-key \
//      -H 'Content-Type: application/vnd.api+json' \
//      -H 'Accept: application/vnd.api+json' \
//      -d '{
//            "meta": {
//              "key": "$KEYGEN_LICENSE_KEY"
//            }
//          }'
app.get('/success', async (req, res) => {
  const { query } = req

  // If we aren't supplied with a customer ID or a payment ID, the request is invalid.
  if (!query.customer_id && !query.payment_id) {
    res.render('error', {
      error: 'Missing payment details'
    })
    return
  }

  // 2. Fetch the MoonClerk resource to make sure our request is valid. We'll get back
  //    a customer resource if the licensee was charged for a subscription, otherwise
  //    we'll get back a payment resource for a one-time purchase.
  let customer
  let payment

  if (query.customer_id) {
    const mres = await fetch(`https://api.moonclerk.com/customers/${query.customer_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token token=${MOONCLERK_API_KEY}`,
        'Accept': 'application/vnd.moonclerk+json;version=1'
      }
    })
    if (mres.status !== 200) { // Invalid! Bail early before we create a license.
      res.render('error', {
        error: 'Invalid customer ID'
      })
      return
    }

    customer = await mres.json()
  } else {
    const mres = await fetch(`https://api.moonclerk.com/payments/${query.payment_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token token=${MOONCLERK_API_KEY}`,
        'Accept': 'application/vnd.moonclerk+json;version=1'
      }
    })
    if (mres.status !== 200) { // Invalid! Bail early before we create a license.
      res.render('error', {
        error: 'Invalid payment ID'
      })
      return
    }

    payment = await mres.json()
  }

  // 3. Create a user-less Keygen license for our new MoonClerk customer.
  const kreq = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      data: {
        type: 'licenses',
        attributes: {
          // Generate a short license key in the form of 'XXXX-XXXX-XXXX-XXXX' that we can
          // send to our customer via email and display on the success page.
          key: crypto.randomBytes(8).toString('hex').split(/(.{4})/).filter(Boolean).join('-'),
          metadata: {
            // One of these fields will be populated depending on if this was a one-time
            // charge or a subscription. We're storing both to be sure.
            moonclerkCustomerId: query.customer_id,
            moonclerkPaymentId: query.payment_id
          }
        },
        relationships: {
          policy: {
            data: { type: 'policies', id: KEYGEN_POLICY_ID }
          }
        }
      }
    })
  })

  const { data: license, errors } = await kreq.json()
  if (errors) {
    const error = errors.map(e => e.detail).toString()

    // If you receive an error here, then you may want to handle the fact the customer
    // may have been charged for a license that they didn't receive e.g. easiest way
    // would be to create the license manually, or refund their payment.
    console.error(`Received error while creating license for ${JSON.stringify(query)}:\n ${error}`)

    res.render('error', { error })
    return
  }

  // 4. All is good! License was successfully created for the new MoonClerk customer.
  //    Next up would be for us to email the license key to our customer's email
  //    using `customer.email` or `payment.email`.

  // 5. Render our success page with the new license resource.
  res.render('success', {
    license
  })
})

app.get('/', async (req, res) => {
  res.render('index')
})

process.on('unhandledRejection', err => {
  console.error(`Unhandled rejection: ${err}`, err.stack)
})

const server = app.listen(PORT, 'localhost', () => {
  const { address, port } = server.address()

  console.log(`Listening at http://${address}:${port}`)
})