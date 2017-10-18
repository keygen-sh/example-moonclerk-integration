# Example Keygen + MoonClerk integration
The following web app is written in Node.js and shows how to integrate
[Keygen](https://keygen.sh) and [MoonClerk](https://moonclerk.com) together
using an embed form "redirect". Much more could be done to automate e.g.
license revocation when a subscription is canceled, etc. by utilizing [the
full suite of webhooks offered by Stripe](https://github.com/keygen-sh/example-stripe-integration).

> **This example application is not 100% production-ready**, but it should
> get you 90% of the way there. You may need to add additional logging,
> error handling, validation, features, etc.

## Running the app locally

First up, configure a few environment variables:
```bash
# Your MoonClerk API key
export MOONCLERK_API_KEY="YOUR_MOONCLERK_API_KEY"

# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"

# The Keygen policy to use when creating licenses for new customers
# after they successfully purchase your product
export KEYGEN_POLICY_ID="YOUR_KEYGEN_POLICY_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):
```
yarn
```

Then start the app:
```
yarn start
```

## Testing redirects locally

For local development, create an [`ngrok`](https://ngrok.com) tunnel:
```
ngrok http 8080
```

## Creating a MoonClerk form

In order to utilize this integration, you need to set up a purchase confirmation
"redirect" for your form to redirect to the `/success` route, which will create
a license for your customer after a successful purchase.

**Please note that the query parameters `customer_id` and `payment_id` within
the URL are required and are filled by MoonClerk**. For example: `https://example.com/success?customer_id={{customer_id}}&payment_id={{payment_id}}` will be transformed to `https://example.com/success?customer_id=01234&payment_id=56789` on redirect.

Here's a screenshot of what that looks like when creating a new form,

![image](https://user-images.githubusercontent.com/6979737/31795591-0ef4a78e-b4ec-11e7-83a8-25ca742abb26.png)

**During development and local testing, you can use the `ngrok` URL that you
generated above**, e.g. `https://{YOUR_NGROK_URL}/success?customer_id={{customer_id}}&payment_id={{payment_id}}`
for the redirect (note the required query parameters).

## Adding your MoonClerk form

You'll need to edit the `/views/index.ejs` file and update the MoonClerk embed
code with your own embed code.

## Testing the integration

Visit the following url: http://localhost:8080 and fill out the purchase form.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!